export interface CacheParams {
    itemLifetime: number;
    monitoringFrequency: number;
    waiterTimeout: number;
    waiterFrequency: number;
}

export interface CacheItem<T> {
    id: string;
    value: T | null;
    createdAt: number;
    fetcher: () => Promise<T>;
    reserved: boolean;
}

export type Fetcher<T> = () => Promise<T>

export default class Cache<T> {
    cache: Map<string, CacheItem<T>>;
    cacheLifetime: number;
    monitoringFrequency: number;
    waiterTimeout: number;
    waiterFrequency: number;
    isMonitoring: boolean;

    constructor({ itemLifetime, monitoringFrequency, waiterTimeout, waiterFrequency }: CacheParams) {
        this.cache = new Map<string, CacheItem<T>>();

        // 10 minute cache lifetime
        this.cacheLifetime = itemLifetime || 1800000;

        // Frequency with which to monitor the cache for expired items
        // or refreshing them.
        this.monitoringFrequency = monitoringFrequency || 60000;

        // The waiter waits for a cache item to become available if it has
        // been reserved. These settings determine how long to wait
        // for a waiter to wait, and how often to check the cache item to see if it has
        // yet been fulfilled.
        this.waiterTimeout = waiterTimeout || 30000;
        this.waiterFrequency = waiterFrequency || 100;

        this.isMonitoring = false;
    }

    private runMonitor() {
        if (this.isMonitoring) {
            return;
        }
        this.isMonitoring = true;
        setTimeout(() => {
            const newCache = new Map<string, any>();
            let cacheRenewed = false;
            Object.keys(this.cache).forEach((id) => {
                const item = this.cache.get(id);
                if (!this.isExpired(item)) {
                    newCache.set(id, item);
                    cacheRenewed = true;
                }
            });
            this.cache = newCache;
            this.isMonitoring = false;
            if (cacheRenewed) {
                this.runMonitor();
            }
        }, this.monitoringFrequency);
    }

    private isExpired(cacheItem: any) {
        const now = new Date().getTime();
        const elapsed = now - cacheItem.createdAt;
        return elapsed > this.cacheLifetime;
    }

    private getItem(id: string) {
        if (this.cache.get(id) === undefined) {
            return null;
        }
        const cached = this.cache.get(id);
        if (this.isExpired(cached)) {
            this.cache.delete(id);
            return;
        }
        return cached;
    }

    /**
     * Wait for a reserved item associated with id to become available, and then 
     * return it.
     * Implements this by polling for a given amount of time, with a given pause time between
     * poll attempts. 
     * Handles the case of a reserve item disappearing between polls, in which case the item
     * will be reserved and fetched.
     * 
     * @param id - an identifier which uniquely identifies an item of type T
     * @param fetcher - a function returning a promise of an item of type T
     */
    private reserveWaiter(id: string, fetcher: Fetcher<T>): Promise<CacheItem<T>> {
        return new Promise<CacheItem<T>>((resolve, reject) => {
            const started = new Date().getTime();
            const waiting = true;

            const waiter = () => {
                if (!waiting) {
                    return;
                }
                setTimeout(() => {
                    const item = this.cache.get(id);
                    // Handle case of an item disappearing from the cache.
                    if (!item) {
                        // If on a wait-loop cycle we discover that the
                        // cache item has been deleted, we volunteer
                        // to attempt to fetch it ourselves.
                        // The only case now for this is a cancellation
                        // of the first request to any dynamic service,
                        // which may cancel the initial service wizard
                        // call rather than the service call.

                        this.reserveAndFetch(id, fetcher)
                            .then(() => {
                                // resolve(result);
                                // we resolve with the cache item just
                                // as if we had waited for it.
                                resolve(this.cache.get(id));
                            })
                            .catch((err: Error) => {
                                reject(err);
                            });
                    } else if (item.reserved) {
                        // Not ready yet, so either ...
                        const elapsed = new Date().getTime() - started;
                        if (elapsed < this.waiterTimeout) {
                            // Our time spent waiting is still within the timeout window, so keep going.
                            waiter();
                            return;
                        } else {
                            // Otherwise we have waited too long, and we just give up.
                            // this.cache.delete(item.id);
                            reject(
                                new Error(
                                    'Timed-out waiting for cache item to become available; timeout ' +
                                    this.waiterTimeout +
                                    ', waited ' +
                                    elapsed
                                )
                            );
                            return;
                        }
                    } else {
                        resolve(item);
                    }
                }, this.waiterFrequency);
            };
            waiter();
        });
    }

    /**
     * Reserve an item of type T, uniquely identified by id, and the proceed to fetch it 
     * and add it to the cache (under that id).
     * 
     * @param id - 
     * @param fetcher - a function which returns promise of a thing T
     */
    private reserveAndFetch(id: string, fetcher: Fetcher<T>) {
        // now, reserve it.
        this.reserveItem(id, fetcher);

        // and then fetch it.
        // We keep a reference to the fetch so that we can determine if
        // the fetch was cancelled.
        const fetchPromise = fetcher()
            .then((result: any) => {
                this.setItem(id, result, fetcher);
                return result;
            })
            .finally(() => {
                // If the fetch was cancelled, we need to remove
                // the reserved item. This should signal any queued waiters
                // to spawn their own fetch.
                // TODO: restore this!
                // if (fetchPromise.isCancelled()) {
                //     this.cache.delete(id);
                // }
            });
        return fetchPromise;
    }

    /**
     * Given an id which uniquely identifies an item of type T,
     * and a fetcher with which to retrieve such an item,
     * return a promise for such an item.
     * 
     * @param id - unique identifier for an object of type T
     * @param fetcher - a function returning a promise of an item of type T
     */
    getItemWithWait({ id, fetcher }: { id: string; fetcher: Fetcher<T> }) {
        const cached = this.cache.get(id);
        if (cached) {
            if (this.isExpired(cached)) {
                this.cache.delete(id);
            } else if (cached.reserved) {
                // Wait until a reserved item is fulfilled (or not!)
                return this.reserveWaiter(id, fetcher).then((cached) => {
                    return cached.value;
                });
            } else {
                // Success!
                return Promise.resolve(cached.value);
            }
        }

        // If not cached, then we try to fetch it.
        return this.reserveAndFetch(id, fetcher);
    }

    /**
     * Adds an item to the cache in a "reserved" state. 
     * This state implies that item is or is going to soon be 
     * fetched.
     * 
     * @param id - some opaque string identifier uniquely associated with the thing T
     * @param fetcher 
     */
    private reserveItem(id: string, fetcher: () => Promise<T>) {
        this.cache.set(id, {
            id: id,
            createdAt: new Date().getTime(),
            reserved: true,
            value: null,
            fetcher: fetcher
        });
    }

    private setItem(id: string, value: T, fetcher: () => Promise<T>) {
        if (this.cache.has(id)) {
            const item = this.cache.get(id);
            if (item && item.reserved) {
                item.reserved = false;
                item.value = value;
                item.fetcher = fetcher;
            } else {
                // overwriting? should we allow this?
                this.cache.set(id, {
                    id: id,
                    createdAt: new Date().getTime(),
                    fetcher: fetcher,
                    reserved: false,
                    value: value
                });
            }
        } else {
            this.cache.set(id, {
                id: id,
                createdAt: new Date().getTime(),
                fetcher: fetcher,
                reserved: false,
                value: value
            });
        }
        this.runMonitor();
    }
}