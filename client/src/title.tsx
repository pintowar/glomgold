import React from "react";

import { useRouterContext, TitleProps } from "@pankod/refine-core";

import logo from "./assets/images/glomgold-logo.png";
import logoCollapsed from "./assets/images/glomgold-logo-collapsed.png";

export const Title: React.FC<TitleProps> = ({ collapsed }) => {
    const { Link } = useRouterContext();

    return (
        <Link to="/" href="/">
            {collapsed ? (
                <img
                    src={logoCollapsed}
                    alt="Glomgold"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "12px 20px",
                        height: "62px",
                    }}
                />
            ) : (
                <img
                    src={logo}
                    alt="Glomgold"
                    style={{
                        width: "200px",
                        padding: "12px 20px",
                    }}
                />
            )}
        </Link>
    );
};