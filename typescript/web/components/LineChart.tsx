import * as React from 'react';
export type ILineChartDataValues = Array<{ batch: number; validationLoss: any; trainingLoss: any }>;

// TODO: Print a line chart
export default class AidaLineChart extends React.Component<{ dataValues: ILineChartDataValues }, any> {
    public render() {
        return <div />;
    }
}
