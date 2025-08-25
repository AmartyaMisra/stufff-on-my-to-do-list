export default function ControlBar({ total, rawCount, loading, error, onRefresh, intervalMs, setIntervalMs }) {
	return (
		<div className="controlbar">
			<button onClick={onRefresh} disabled={loading}>{loading ? 'Fetching…' : 'Refresh'}</button>
			<label style={{ marginLeft: 12 }}>
				Interval (sec):{' '}
				<input
					type="number"
					min={10}
					max={60}
					value={Math.round(intervalMs / 1000)}
					onChange={e => setIntervalMs(Math.max(10000, Math.min(60000, Number(e.target.value) * 1000)))}
				/>
			</label>
			<span style={{ marginLeft: 12 }}>Showing: <b>{total}</b> (raw:{rawCount})</span>
			{error ? <span style={{ marginLeft: 12, color: 'tomato' }}>OpenSky throttling/empty: {error}</span> : null}
		</div>
	);
}
