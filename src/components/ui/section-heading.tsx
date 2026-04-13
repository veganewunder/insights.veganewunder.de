type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
};

export function SectionHeading({ eyebrow, title, description }: SectionHeadingProps) {
  return (
    <div>
      {eyebrow ? (
        <p className="mb-1 text-xs font-medium uppercase tracking-widest text-stone">{eyebrow}</p>
      ) : null}
      <h2 className="text-xl font-bold text-ink">{title}</h2>
      {description ? (
        <p className="mt-1 text-sm text-stone">{description}</p>
      ) : null}
    </div>
  );
}
