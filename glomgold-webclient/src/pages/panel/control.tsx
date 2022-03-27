import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Row, Col, notification } from "antd";
import moment from "moment";

import { PanelLayout } from "./layout";

import "./panel.css";
import { IItem } from "../../interfaces";

import { PeriodSummaryCard, PeriodNavigationCard, MonthItemsCard, MonthStatsCard } from "./components/control";
import { useGetIdentity } from "@pankod/refine-core";
import { DEFAULT_LOCALE, DEFAULT_CURRENCY, DEFAULT_SYMBOL } from "../../constants";
import { axiosInstance } from "authProvider";

interface ControlPanelData {
    items: IItem[];
    stats: IItem[];
    total: number;
    diff: number;
}

export const ControlPanel: React.FC = () => {
    const { data: identity } = useGetIdentity<{ locale: string; currency: string; symbol: string }>();
    const locale = identity?.locale || DEFAULT_LOCALE;
    const currency = identity?.currency || DEFAULT_CURRENCY;
    const symbol = identity?.symbol || DEFAULT_SYMBOL;

    const periodFormat = "YYYY-MM";
    const location = useLocation();
    const navigate = useNavigate();
    const period = new URLSearchParams(location.search).get("period") || moment().format(periodFormat);

    const [currentPeriod, setCurrentPeriod] = useState(moment(period, periodFormat));
    const [panelData, setPanelData] = useState<ControlPanelData>({
        items: [],
        stats: [],
        total: 0,
        diff: 0,
    });

    const formattedPeriod = useMemo(() => currentPeriod.format(periodFormat), [currentPeriod]);

    useEffect(() => {
        const populateData = async () => {
            const { status, data } = await axiosInstance.get(`/api/panel?period=${formattedPeriod}`);
            if (status === 200) {
                setPanelData(data);
                navigate(`/panel?period=${formattedPeriod}`);
            } else throw Error();
        };

        populateData();
    }, [formattedPeriod, navigate]);

    const onAddItem = async (description: string, value: number) => {
        const { status, data } = await axiosInstance.post("/api/panel/add-item", {
            description,
            value,
            period: formattedPeriod,
        });
        if (status === 200) {
            setPanelData(data);
        } else throw Error();
    };

    const onEditItem = async (id: number, description: string, value: number) => {
        const { status, data } = await axiosInstance.patch(`/api/panel/edit-item/${id}`, {
            description,
            value,
            period: formattedPeriod,
        });
        if (status === 200) {
            setPanelData(data);
        } else throw Error();
    };

    const onDeleteItem = async (itemId: number) => {
        const { status, data } = await axiosInstance.delete(`/api/panel/remove-item/${itemId}`);
        if (status === 200) {
            setPanelData(data);
        } else throw Error();
    };

    const onBatchDelete = async (itemIds: number[]) => {
        const { status, data } = await axiosInstance.delete(
            `/api/panel/remove-items/${formattedPeriod}?ids=${itemIds.join(",")}`
        );
        if (status === 200) {
            setPanelData(data);
        } else throw Error();
    };

    const onMonthItemCopy = async (items: any[]) => {
        const itemsWithPeriod = items.map((it) => ({ ...it, period: formattedPeriod }));

        const { status } = await axiosInstance.post(`/api/panel/copy-items`, itemsWithPeriod);
        if (status !== 200) {
            throw Error();
        } else {
            notification["success"]({
                message: "Successfuly Operation",
                description: "Items were successfuly replicated to the next month",
            });
        }
    };

    const tableData = panelData.items.map(({ id, description, value }) => ({ key: id, description, value }));

    return (
        <PanelLayout>
            <div className="card-row">
                <Row gutter={[24, 24]}>
                    <Col span={12}>
                        <PeriodNavigationCard
                            value={currentPeriod}
                            onValueChange={setCurrentPeriod}
                            format={periodFormat}
                        />
                    </Col>
                    <Col span={12}>
                        <PeriodSummaryCard
                            total={panelData.total}
                            difference={panelData.diff}
                            locale={locale}
                            symbol={symbol}
                        />
                    </Col>
                </Row>
            </div>
            <div className="card-row">
                <Row gutter={[24, 24]}>
                    <Col span={12}>
                        <MonthItemsCard
                            tableData={tableData}
                            locale={locale}
                            currency={currency}
                            symbol={symbol}
                            onAddItem={onAddItem}
                            onDeleteItem={onDeleteItem}
                            onEditItem={onEditItem}
                            onMonthItemCopy={onMonthItemCopy}
                            onBatchDelete={onBatchDelete}
                        />
                    </Col>
                    <Col span={12}>
                        <MonthStatsCard tableData={panelData.stats} />
                    </Col>
                </Row>
            </div>
        </PanelLayout>
    );
};
