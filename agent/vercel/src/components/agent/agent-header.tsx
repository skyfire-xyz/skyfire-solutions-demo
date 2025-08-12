import { motion } from "motion/react";

export function AgentHeader() {
  return (
    <motion.header className="flex items-center justify-between gap-4 p-4 bg-white border-b">
      <div className="flex items-center gap-2 ">
        <div className="p-1 bg-white rounded-full hidden lg:block">
          <SkyfireIcon className="size-4 stroke-black" />
        </div>
        <span className="text-xs text-[#D4D4D8] hidden lg:block">|</span>
        <h1 className="text-xs font-bold tracking-tight inline-flex items-center gap-1">
          <span className="hidden lg:block">Data Analyst Agent</span>
          <span className="hidden lg:block">Demo</span>
        </h1>
      </div>
    </motion.header>
  );
}

export function SkyfireIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 18 20"
      width="256"
      height="222"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid"
      {...props}
    >
      <g
        id="Page-1"
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
      >
        <g
          id="Group-1410103655"
          transform="translate(0.000000, 0.000000)"
          fill="#28171B"
          fillRule="nonzero"
        >
          <path
            d="M6.059162,14.409141 L8.869782,14.409141 C10.710792,14.409141 12.203292,12.916641 12.203292,11.075641 L12.203292,8.277311 C12.203292,6.858501 13.919092,6.149091 14.920592,7.150601 L17.277092,9.507141 C17.576592,9.806541 17.743492,10.211641 17.743492,10.633841 L17.743492,18.356241 C17.743492,19.235041 17.031592,19.949341 16.150392,19.949341 L8.425482,19.949341 C8.003282,19.949341 7.600712,19.782441 7.301242,19.485441 L4.934922,17.128941 C3.928492,16.127441 4.637902,14.409141 6.059162,14.409141 Z"
            id="Path"
          ></path>
          <path
            d="M11.684292,5.542681 L8.873702,5.542681 C7.032682,5.542681 5.540232,7.035131 5.540232,8.876151 L5.540232,11.674541 C5.540232,13.093341 3.824402,13.802741 2.822892,12.801241 L0.466391,10.439741 C0.166919,10.140341 -5.68434189e-14,9.735241 -5.68434189e-14,9.313081 L-5.68434189e-14,1.593091 C-5.68434189e-14,0.711861 0.711862,0 1.593092,0 L9.317992,0 C9.740192,0 10.142792,0.166918 10.442292,0.463931 L12.808592,2.820431 C13.814992,3.821951 13.105592,5.540231 11.684292,5.540231 L11.684292,5.542681 Z"
            id="Path"
          ></path>
        </g>
      </g>
    </svg>
  );
}
