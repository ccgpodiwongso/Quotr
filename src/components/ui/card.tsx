import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  footer?: React.ReactNode;
}

function Card({
  className = "",
  title,
  description,
  footer,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={[
        "bg-white border border-zinc-200 shadow-sm rounded-card",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      <div className="p-5">
        {(title || description) && (
          <div className={children ? "mb-4" : ""}>
            {title && (
              <h3 className="text-base font-semibold text-zinc-900">
                {title}
              </h3>
            )}
            {description && (
              <p className="mt-1 text-sm text-zinc-500">{description}</p>
            )}
          </div>
        )}
        {children}
      </div>
      {footer && (
        <div className="border-t border-zinc-200 px-5 py-3 bg-zinc-50/50 rounded-b-card">
          {footer}
        </div>
      )}
    </div>
  );
}

export { Card };
