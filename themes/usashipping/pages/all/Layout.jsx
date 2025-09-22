import React from "react";
import Area from "@components/common/Area";
import LoadingBar from "@components/common/LoadingBar";
import "../../css/global.scss";
import "./Layout.scss";
import "./tailwind.scss";

// TODO: better just use Footer
export default function Layout() {
  const year = "2025";
  const domainName = "Domain-Name";
  return (
    <>
      <LoadingBar />
      <div className="header">
        <div className="page-width flex justify-between">
          <Area
            id="header"
            noOuter
            coreComponents={[
              {
                component: { default: Area },
                props: {
                  id: "icon-wrapper",
                  className: "icon-wrapper flex justify-between space-x-1",
                },
                sortOrder: 20,
              },
            ]}
          />
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