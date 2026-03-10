import React from "react";
import Area from "@components/common/Area";
import LoadingBar from "@components/common/LoadingBar";
import "./tailwind.scss";
import "../../css/global.scss";
import "@evershop/evershop/src/modules/cms/pages/frontStore/all/Layout.scss";

export default function Layout() {
  return (
    <>
      <LoadingBar />
      <div className="header">
        <div className="page-width header-inner">
          {/* Left: Logo */}
          <Area id="header" noOuter />
          {/* Center: persistent search bar (hidden on mobile) */}
          <Area id="header-search" noOuter />
          {/* Right: Sign In + Cart (with mobile search toggle) */}
          <Area id="header-actions" noOuter />
        </div>
      </div>
      <main className="content">
        <Area id="content" className="" noOuter />
      </main>
      <div className="footer">
        <Area id="footer" className="" noOuter />
      </div>
    </>
  );
}

export const layout = {
  areaId: "body",
  sortOrder: 1,
};
