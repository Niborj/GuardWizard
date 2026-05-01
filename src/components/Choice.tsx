import type { ReactNode } from "react";

interface Option<T extends string> {
  value: T;
  label: string;
  description?: string;
  badge?: string;
  icon?: ReactNode;
}

interface Props<T extends string> {
  value: T;
  onChange: (v: T) => void;
  options: Option<T>[];
  columns?: 1 | 2 | 3;
}

export function Choice<T extends string>({
  value,
  onChange,
  options,
  columns = 2,
}: Props<T>) {
  const cols =
    columns === 3
      ? "sm:grid-cols-2 lg:grid-cols-3"
      : columns === 2
        ? "sm:grid-cols-2"
        : "";
  return (
    <div className={`grid gap-3 ${cols}`}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={[
              "relative text-left rounded-lg border p-4 transition-all",
              selected
                ? "border-cato-green bg-cato-mist text-cato-black shadow-glow"
                : "border-cato-line bg-cato-navy/40 text-cato-mist hover:border-cato-green/70 hover:bg-cato-navy-2",
            ].join(" ")}
          >
            {selected && (
              <span className="absolute inset-y-3 left-0 w-1 rounded-r bg-cato-green" />
            )}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                {o.icon}
                <span
                  className={[
                    "font-medium",
                    selected ? "text-cato-black" : "text-cato-mist",
                  ].join(" ")}
                >
                  {o.label}
                </span>
              </div>
              {o.badge && (
                <span
                  className={[
                    "chip",
                    selected
                      ? "border-cato-green bg-cato-green text-white"
                      : "border-cato-green/40 text-cato-green bg-cato-green/5",
                  ].join(" ")}
                >
                  {o.badge}
                </span>
              )}
            </div>
            {o.description && (
              <p
                className={[
                  "mt-1.5 text-xs leading-relaxed",
                  selected ? "text-cato-black/75" : "text-cato-mist-2",
                ].join(" ")}
              >
                {o.description}
              </p>
            )}
          </button>
        );
      })}
    </div>
  );
}

interface CheckOption<T extends string> {
  value: T;
  label: string;
  description?: string;
}

interface CheckProps<T extends string> {
  values: T[];
  onChange: (next: T[]) => void;
  options: CheckOption<T>[];
}

export function CheckList<T extends string>({
  values,
  onChange,
  options,
}: CheckProps<T>) {
  return (
    <div className="grid gap-2">
      {options.map((o) => {
        const checked = values.includes(o.value);
        return (
          <label
            key={o.value}
            className={[
              "relative flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors",
              checked
                ? "border-cato-green bg-cato-mist text-cato-black shadow-glow"
                : "border-cato-line bg-cato-navy/40 text-cato-mist hover:border-cato-green/70",
            ].join(" ")}
          >
            {checked && (
              <span className="absolute inset-y-3 left-0 w-1 rounded-r bg-cato-green" />
            )}
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => {
                if (e.target.checked) onChange([...values, o.value]);
                else onChange(values.filter((v) => v !== o.value));
              }}
              className="mt-0.5 h-4 w-4 accent-cato-green"
            />
            <div>
              <div
                className={[
                  "font-medium",
                  checked ? "text-cato-black" : "text-cato-mist",
                ].join(" ")}
              >
                {o.label}
              </div>
              {o.description && (
                <p
                  className={[
                    "text-xs mt-0.5",
                    checked ? "text-cato-black/75" : "text-cato-mist-2",
                  ].join(" ")}
                >
                  {o.description}
                </p>
              )}
            </div>
          </label>
        );
      })}
    </div>
  );
}
