import React from 'react';

export interface NarrativeLinkProps {
    narrativeID: number;
}

interface NarrativeLinkState {

}

export default class NarrativeLink extends React.Component<NarrativeLinkProps, NarrativeLinkState> {
    render() {
        const href = `/narrative/${this.props.narrativeID}`;
        return <a href={href} target='_blank' rel="noopener noreferrer">
            {this.props.children}
        </a>;
    }
}