const getRandomUsername = (): string => {
	const adjetives = [
		'goofy',
		'zany',
		'whimsical',
		'ludicrous',
		'wacky',
		'quirky',
		'absurd',
		'amusing',
		'hilarious',
		'ridiculous',
		'eccentric',
		'comical',
		'kooky',
		'lighthearted',
		'playful',
		'laughable',
		'giggly',
		'jovial',
		'merry',
		'jocular',
		'mirthful',
		'uproarious',
		'joking',
		'droll',
		'fun-loving',
		'rollicking',
		'farcical',
		'facetious',
		'grinning',
		'smiling',
		'gleeful',
		'joyful',
		'cheerful',
		'pleasurable',
		'entertaining',
		'whoopee',
		'silly',
		'humorous',
		'light-hearted',
		'funny',
		'enthusiastic',
		'exuberant',
		'giddy',
		'kidding',
		'jesting',
		'jubilant',
		'funtastic',
		'hysterical',
	];

	const nouns = [
		'Chucklehead',
		'Whoopee',
		'Snickerdoodle',
		'Gigglesnort',
		'Noodlehead',
		'Jellybean',
		'Pickleball',
		'Bumblebee',
		'Gobbledygook',
		'Jamboree',
		'Razzle',
		'Wobblebottom',
		'Lollygag',
		'Jestmaster',
		'Guffaw',
		'Bamboozle',
		'Gobsmacked',
		'Nincompoop',
		'Brouhaha',
		'Kerfuffle',
		'Lollypop',
		'Jellyfish',
		'Wigglywoo',
		'Doodlebug',
		'Snickersnee',
		'Ziggity',
		'Malarkey',
		'Ziggurat',
		'Tickle',
		'Hyena',
		'Noodle',
		'Quack',
		'Doodle',
		'Gigglypuff',
		'Hootenanny',
		'Jigglypuff',
		'Zaggity',
		'Hobbledehoy',
		'Banana',
		'Cushion',
		'Goose',
		'Monster',
		'Dazzle',
		'Noggin',
		'Belly',
		'Hysterics',
		'Jabber',
		'Nounery',
	];

	return `${adjetives[Math.floor(Math.random() * adjetives.length)]}${
		nouns[Math.floor(Math.random() * nouns.length)]
	}`;
};

export default getRandomUsername;
