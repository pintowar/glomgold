import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from 'react-router-dom';

import { Row, Col, notification } from 'antd';
import { AxiosInstance } from 'axios';
import moment from 'moment';

import { PanelLayout } from "./layout";

import './panel.css'
import { IItem } from '../../interfaces'

import { PeriodSummaryCard, PeriodNavigationCard, MonthItemsCard, MonthStatsCard } from './components/control'
import { LocalStorage } from "LocalStorage";

interface ControlPanelData {
    items: IItem[]
    stats: IItem[]
    total: number
    diff: number
}

interface ControlPanelProps {
    axios: AxiosInstance
}

export const ControlPanel: React.FC<ControlPanelProps> = ({axios}) => {
    const {locale, currency, symbol} = LocalStorage.getInstance().getUser();

    const periodFormat = 'YYYY-MM';
    const location = useLocation();
    const navigate = useNavigate();
    const period = new URLSearchParams(location.search).get("period") || moment().format(periodFormat);

    const [currentPeriod, setCurrentPeriod] = useState(moment(period, periodFormat));
    const [panelData, setPanelData] = useState<ControlPanelData>({
        items: [],
        stats: [],
        total: 0,
        diff: 0
    });

    useEffect(() => {
        populateData()
    }, [currentPeriod]);

    const populateData = async () => {
        const {status, data} = await axios.get(`/api/panel?year=${currentPeriod.year()}&month=${currentPeriod.month() + 1}`)
        if (status === 200) {
            setPanelData(data)
            navigate(`/panel?period=${currentPeriod.format(periodFormat)}`)
        } else throw Error()
    }

    const onAddItem = async (description: string, value: number) => {
        const year = currentPeriod.year()
        const month = currentPeriod.month() + 1

        const {status, data} = await axios.post("/api/panel/add-item", {year, month, description, value})
        if (status === 200) {
            setPanelData(data)
        } else throw Error()
    };

    const onEditItem = async (id: number, description: string, value: number) => {
        const year = currentPeriod.year()
        const month = currentPeriod.month() + 1

        const {status, data} = await axios.patch(`/api/panel/edit-item/${id}`, {year, month, description, value})
        if (status === 200) {
            setPanelData(data)
        } else throw Error()
    };

    const onDeleteItem = async (itemId: number) => {
        const {status, data} = await axios.delete(`/api/panel/remove-item/${itemId}`)
        if (status === 200) {
            setPanelData(data)
        } else throw Error()
    };

    const onMonthItemCopy = async (items: any[]) => {
        const year = currentPeriod.year()
        const month = currentPeriod.month() + 1

        const itemsWithPeriod = items.map(it => ({...it, year, month}))

        const {status} = await axios.post(`/api/panel/copy-items`, itemsWithPeriod)
        if (status !== 200) {
            throw Error()
        } else {
            notification['success']({
                message: 'Successfuly Operation',
                description: 'Items were successfuly replicated to the next month'
            })
        }
    };

    const tableData = panelData.items.map(({id, description, value}) => ({key: id, description, value}));

    return (
        <PanelLayout>
            <div className="card-row">
                <Row gutter={[24, 24]}>
                    <Col span={12}>
                        <PeriodNavigationCard value={currentPeriod} onValueChange={setCurrentPeriod} format={periodFormat} />
                    </Col>
                    <Col span={12}>
                        <PeriodSummaryCard total={panelData.total} difference={panelData.diff} locale={locale} symbol={symbol}/>
                    </Col>
                </Row>
            </div>
            <div className="card-row">
                <Row gutter={[24, 24]}>
                    <Col span={12}>
                        <MonthItemsCard tableData={tableData} locale={locale} currency={currency}
                            onAddItem={onAddItem} onDeleteItem={onDeleteItem} onEditItem={onEditItem} onMonthItemCopy={onMonthItemCopy}/>
                    </Col>
                    <Col span={12}>
                        <MonthStatsCard tableData={panelData.stats} />
                    </Col>
                </Row>
            </div>
        </PanelLayout>
    );
}