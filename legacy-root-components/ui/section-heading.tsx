type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description?: string;
};

export function SectionHeading({ eyebrow, title, description }: SectionHeadingProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-[0.26em] text-stone">{eyebrow}</p>
      <h2
        className="text-2xl leading-tight text-ink md:text-3xl"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {title}
      </h2>
      {description ? <p className="max-w-2xl text-sm leading-6 text-stone">{description}</p> : null}
    </div>
  );
}
