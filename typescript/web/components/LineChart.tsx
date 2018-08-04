import * as React from 'react';
import { CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';

export type ILineChartDataValues = Array<{ batch: number; validationLoss: any; trainingLoss: any }>;

export default class AidaLineChart extends React.Component<{ dataValues: ILineChartDataValues }, any> {
    public render() {
        return (
            <div>
                <LineChart width={450} height={250} data={this.props.dataValues} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="x" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="validationLoss" stroke="#8884d8" />
                    <Line type="monotone" dataKey="trainingLoss" stroke="#82ca9d" />
                </LineChart>
            </div>
        );
    }
}
