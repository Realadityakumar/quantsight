'use client';


import React, { useEffect } from 'react'

const useTradingViewWidget = (scriptUrl: string,config: Record<string,unknown>,height = 600) => {
  const containerRef = React.useRef(null);
    useEffect(
    () => {
        if(!containerRef.current) return;
        //@ts-ignore
        if(containerRef.current.dataset.loaded) return;
        //@ts-ignore
        containerRef.current.innerHTML = `<div class='tradingview-widget-container__widget' style='height: ${height}px;width:100%;'></div>`;

      const script = document.createElement("script");
      script.src = scriptUrl;
      script.type = "text/javascript";
      script.async = true;
      script.innerHTML = JSON.stringify(config) ;
      //@ts-ignore
        containerRef.current.appendChild(script);
        //@ts-ignore
        containerRef.current.dataset.loaded = "true";

        return () => {  
            if(containerRef.current) {
                //@ts-ignore
                containerRef.current.innerHTML = "";
                //@ts-ignore
                delete containerRef.current.dataset.loaded;
            }
        }
    },
    [scriptUrl, config, height]
  );
  return containerRef
}

export default useTradingViewWidget