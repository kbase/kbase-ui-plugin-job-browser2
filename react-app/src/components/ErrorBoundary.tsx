import React from 'react';
import { Alert } from 'antd';

export interface ErrorBoundaryProps {

}

interface ErrorBoundaryState {
    errorMessage: string | null;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {
            errorMessage: null
        }
    }

    static getDerivedStateFromError(error: Error) {
        return {
            errorMessage: error.message
        }
    }

    componentDidCatch(error: Error, errorInfo: any) {
        console.error('ERROR', error, errorInfo);
    }

    render() {
        if (this.state.errorMessage) {
            const message = this.state.errorMessage;
            return <Alert type="error" message={message} />
        }
        return this.props.children;
    }
}