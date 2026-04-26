"use client";

import * as React from "react";
import { Switch as SwitchPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

function Switch({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: "sm" | "default";
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        // 공통
        "group/switch shadow-xs peer inline-flex shrink-0 items-center rounded-full outline-none transition-all",
        "focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
        "data-[size=default]:h-5 data-[size=sm]:h-3.5 data-[size=default]:w-9 data-[size=sm]:w-6",
        // ON 상태: 라이트=진한 회색 배경, 다크=밝은 회색 배경
        "data-[state=checked]:border-0 data-[state=checked]:bg-zinc-800",
        "dark:data-[state=checked]:bg-zinc-200",
        // OFF 상태: 라이트=중간 회색 배경+테두리, 다크=어두운 회색 배경+테두리
        "data-[state=unchecked]:border-2 data-[state=unchecked]:border-zinc-500 data-[state=unchecked]:bg-zinc-300",
        "dark:data-[state=unchecked]:border-zinc-500 dark:data-[state=unchecked]:bg-zinc-600",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block rounded-full ring-0 transition-transform",
          "data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0",
          "group-data-[size=default]/switch:size-[1.125rem] group-data-[size=sm]/switch:size-3",
          // ON 상태 thumb: 라이트=흰색, 다크=진한 회색
          "data-[state=checked]:bg-white",
          "dark:data-[state=checked]:bg-zinc-900",
          // OFF 상태 thumb: 라이트=진한 회색, 다크=밝은 회색
          "data-[state=unchecked]:bg-zinc-600",
          "dark:data-[state=unchecked]:bg-zinc-300"
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
