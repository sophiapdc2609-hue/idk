// A deliberately small, safe format: no HTML or executable markup.
export function FormattedText({ text }: { text: string }) {
  return (
    <>
      {text
        .split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
        .map((part, i) =>
          part.startsWith("**") ? (
            <strong key={i}>{part.slice(2, -2)}</strong>
          ) : part.startsWith("*") ? (
            <em key={i}>{part.slice(1, -1)}</em>
          ) : (
            <span key={i}>{part}</span>
          ),
        )}
    </>
  );
}
