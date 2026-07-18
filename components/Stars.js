// Star rating display (ported from starRating() in config.php)
export default function Stars({ rating }) {
  const r = Number(rating || 0);
  return (
    <>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={`star ${r >= i ? 'filled' : r >= i - 0.5 ? 'half' : 'empty'}`}>★</span>
      ))}
    </>
  );
}
