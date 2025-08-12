import { type FC, memo } from "react";
import { type Plugin } from "unified";
import ReactMarkdown, { type Components } from "react-markdown";

import { cn } from "@/lib/utils";

interface MarkdownProps {
  children: string;
  className?: string;
  components?: Components;
  remarkPlugins?: Plugin[];
  rehypePlugins?: Plugin[];
}

const defaultComponents: Components = {
  pre: ({ children, ...props }) => (
    <pre
      {...props}
      className={cn(
        "overflow-x-auto p-4 rounded-lg",
        "bg-neutral-50 text-neutral-900",
        "font-mono text-sm",
        "border border-neutral-200",
        "w-full"
      )}
    >
      {children}
    </pre>
  ),

  code: ({ children, className, ...props }) => (
    <code
      className={cn(
        "relative rounded font-mono text-sm",
        "bg-neutral-100 text-neutral-900",
        "py-[0.2rem] px-[0.3rem]",
        "whitespace-pre-wrap break-words",
        "not-prose",
        className?.includes("language-") ? "block" : "inline-block",
        className
      )}
      {...props}
    >
      {children}
    </code>
  ),
};

export const MarkdownRenderer: FC<MarkdownProps> = memo(
  ({ children, className, components, remarkPlugins = [], ...props }) => (
    <div
      className={cn(
        "prose prose-sm dark:prose-invert",
        "max-w-none break-words overflow-hidden",
        "[&_pre]:bg-neutral-50 [&_pre]:text-neutral-900",
        "[&_code]:text-neutral-900",
        className
      )}
    >
      <ReactMarkdown
        components={{ ...defaultComponents, ...components }}
        remarkPlugins={remarkPlugins}
        {...props}
      >
        {children}
      </ReactMarkdown>
    </div>
  ),
  (prevProps, nextProps) =>
    prevProps.children === nextProps.children &&
    prevProps.className === nextProps.className
);

MarkdownRenderer.displayName = "MarkdownRenderer";

export const MemoizedReactMarkdown = MarkdownRenderer;
