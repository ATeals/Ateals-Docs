import React from "react";
import { DocsThemeConfig, useConfig } from "nextra-theme-docs";
import siteConfig from "@/config/siteConfig";
import { useRouter } from "next/router";
import Main from "@/components/main";

const config: DocsThemeConfig = {
  logo: Logo,
  project: {
    link: "https://github.com/shuding/nextra-docs-template",
  },
  docsRepositoryBase: "https://github.com/shuding/nextra-docs-template",
  footer: {
    text: "Powered by Nextra",
  },
  navigation: {
    next: true,
    prev: true,
  },
  sidebar: {
    defaultMenuCollapseLevel: 1,
  },
  editLink: {
    text: "",
  },
  feedback: {
    labels: "",
    content: "",
  },
  main: Main,
  useNextSeoProps: () => {
    const config = useConfig();
    const { asPath } = useRouter();

    const { title, description, cover } = config.frontMatter;

    return {
      title: title && asPath !== "/" ? `${title} | Docs` : siteConfig.meta.title,
      description: description || siteConfig.meta.description,
      openGraph: {
        images: [{ url: cover || siteConfig.meta.img }],
      },
    };
  },
};

export default config;

function Logo() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 5 }}>
      <img src={siteConfig.LOGO} alt="logo" width={40} height={40} />
      <span>Documents</span>
    </div>
  );
}
