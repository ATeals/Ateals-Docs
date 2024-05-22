import React from "react";

import { Giscus } from "./Giscus";

const Main = ({ children }) => {
  return (
    <>
      {children} <Giscus />
    </>
  );
};

export default Main;
