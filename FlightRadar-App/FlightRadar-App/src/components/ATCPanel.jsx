const STATIONS = [
	{ name: 'LiveATC Index', url: 'https://www.liveatc.net/' },
	{ name: 'San Francisco (KSFO)', url: 'https://www.liveatc.net/search/?icao=KSFO' },
	{ name: 'Heathrow (EGLL)', url: 'https://www.liveatc.net/search/?icao=EGLL' },
];

export default function ATCPanel() {
	return (
		<aside className="atc">
			<h3>Live ATC</h3>
			<ul>
				{STATIONS.map(s => (
					<li key={s.url}><a href={s.url} target="_blank" rel="noreferrer">{s.name}</a></li>
				))}
			</ul>
		</aside>
	);
}
