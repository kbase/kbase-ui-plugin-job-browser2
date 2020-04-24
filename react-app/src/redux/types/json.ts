export type JSONScalarValue = string | number | boolean | null;

export type JSONValue = JSONScalarValue | JSONObject | JSONArray;


export interface JSONObjectOf<T extends JSONValue> {
    [x: string]: T;
}


export type JSONObject = JSONObjectOf<JSONValue>;

export interface JSONArrayOf<T extends JSONValue> extends Array<T> { };

export type JSONArray = JSONArrayOf<JSONValue>;

