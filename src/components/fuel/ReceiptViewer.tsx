export function ReceiptViewer({ url }: { url?: string }) {
  if (!url) return <div>No receipt available</div>;
  return <div>Receipt: {url}</div>;
}
