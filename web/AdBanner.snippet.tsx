// Inside your ad component. If you only render <ins class="adsbygoogle"> when the container is
// actually visible (a good idea anyway — hidden <ins> elements steal push() calls), re-measure when
// the gate resumes ads on the first screen.
useEffect(() => {
  const el = containerRef.current;
  if (!el) return;
  setVisible(el.getClientRects().length > 0);
  const onResume = () => setVisible(el.getClientRects().length > 0);
  window.addEventListener("ads-gate-resumed", onResume);
  return () => window.removeEventListener("ads-gate-resumed", onResume);
}, []);

// And give the wrapper the class the CSS hides:
// <div ref={containerRef} className="ad-slot"> ... </div>
