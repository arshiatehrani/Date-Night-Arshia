/**
 * ==========================================================================
 * CUTE DATE PROJECT - CORE LOGIC
 * Architecture: Modular ES6 classes for maintainability and performance.
 * ==========================================================================
 */

// --------------------------------------------------------------------------
// 1. STATE MANAGEMENT
// --------------------------------------------------------------------------
const AppState = {
    date: null,
    time: null,
    recipient: null,        // from the ?to= URL param (who you sent the link to)
    activity: null,
    activityKey: 'default', // drives the emoji rain theme
    activityEmoji: '💕',    // the category emoji (always kept)
    needsFood: false,
    food: null,
    cuisineKey: null,
    foodEmojis: [],
    planner: null,          // 'me' | 'her' | null
    planNotes: null,
    dateNote: null,         // a little note she can leave you
    excitement: 50,
    emojiTheme: ['❤️']
};

// Diverse, activity-relevant emoji sets for the celebration rain.
const ACTIVITY_EMOJIS = {
    coffee:    ['☕', '🥐', '🍩', '🚶', '🌳', '💛', '❤️', '😊', '✨', '🌸'],
    drinks:    ['🍹', '🍸', '🍺', '🥂', '🍾', '🍋', '🌴', '❤️', '✨', '😋'],
    bar:       ['🎱', '🍸', '🍺', '🎯', '🕶️', '🎶', '🍻', '😎', '❤️', '✨'],
    dinner:    ['🍽️', '🍷', '🕯️', '🍝', '🥂', '🌙', '❤️', '😋', '🌹', '✨'],
    movie:     ['🎬', '🍿', '🎥', '🍰', '🥤', '⭐', '❤️', '😍', '🎞️', '✨'],
    sports:    ['🎾', '🏃', '🏊', '🏸', '⚽', '💪', '🥇', '🔥', '❤️', '✨'],
    sun:       ['☀️', '🏖️', '🕶️', '🌞', '🌴', '🍹', '😎', '🌊', '❤️', '✨'],
    bowling:   ['🎳', '🎯', '🏆', '🥎', '🎉', '🕺', '😄', '🔥', '❤️', '✨'],
    sunset:    ['🌅', '🌇', '🏰', '💛', '🧡', '✨', '❤️', '🥰', '🌊', '⭐'],
    nightdrive:['🌙', '🚗', '🌃', '🎵', '⭐', '🌌', '🛣️', '💫', '❤️', '✨'],
    games:     ['🎲', '🕹️', '🧩', '🔐', '🎯', '🏆', '❤️', '😄', '🎮', '✨'],
    art:       ['🎨', '🖌️', '🏺', '🖼️', '✏️', '🌈', '❤️', '✨', '🎭', '💜'],
    outdoor:   ['🚲', '🥾', '🏞️', '🌲', '🛶', '☀️', '❤️', '💪', '🍃', '✨'],
    music:     ['🎶', '🎤', '🎸', '🎧', '🎉', '🕺', '❤️', '🥳', '🎼', '✨'],
    picnic:    ['🧺', '🌳', '🍓', '🥪', '☀️', '🌸', '❤️', '✨', '🍷', '🦋'],
    heplans:   ['💫', '✨', '😌', '🎁', '❤️', '🥰', '🌹', '💝', '🌟', '💖'],
    sheplans:  ['📋', '📝', '💪', '😏', '❤️', '✨', '🎯', '💕', '🗒️', '🌟'],
    default:   ['❤️', '💕', '💖', '✨', '🌸', '😊', '💗', '🥰']
};

// Cuisines -> specific dishes. emoji = tile/rain emoji; dishes carry their own emoji + name.
const CUISINES = [
    { key: 'italian',  name: 'Italian',        emoji: '🍕', dishes: [{ e: '🍕', n: 'Pizza' }, { e: '🍝', n: 'Pasta' }, { e: '🍚', n: 'Risotto' }, { e: '🧀', n: 'Lasagna' }] },
    { key: 'japanese', name: 'Japanese',       emoji: '🍣', dishes: [{ e: '🍣', n: 'Sushi' }, { e: '🍜', n: 'Ramen' }, { e: '🍤', n: 'Tempura' }, { e: '🍱', n: 'Bento' }] },
    { key: 'chinese',  name: 'Chinese',        emoji: '🥡', dishes: [{ e: '🥟', n: 'Dumplings' }, { e: '🍜', n: 'Noodles' }, { e: '🍚', n: 'Fried Rice' }, { e: '🍲', n: 'Hot Pot' }] },
    { key: 'mexican',  name: 'Mexican',        emoji: '🌮', dishes: [{ e: '🌮', n: 'Tacos' }, { e: '🌯', n: 'Burritos' }, { e: '🧀', n: 'Quesadilla' }, { e: '🫓', n: 'Nachos' }] },
    { key: 'indian',   name: 'Indian',         emoji: '🍛', dishes: [{ e: '🍛', n: 'Butter Chicken' }, { e: '🍚', n: 'Biryani' }, { e: '🥘', n: 'Curry' }, { e: '🫓', n: 'Naan' }] },
    { key: 'american', name: 'American',       emoji: '🍔', dishes: [{ e: '🍔', n: 'Burgers' }, { e: '🍖', n: 'BBQ' }, { e: '🍗', n: 'Fried Chicken' }, { e: '🥩', n: 'Steak' }] },
    { key: 'mideast',  name: 'Middle Eastern', emoji: '🥙', dishes: [{ e: '🥙', n: 'Shawarma' }, { e: '🍢', n: 'Kebab' }, { e: '🧆', n: 'Falafel' }, { e: '🍚', n: 'Persian Rice' }] },
    { key: 'dessert',  name: 'Dessert',        emoji: '🍰', dishes: [{ e: '🍨', n: 'Ice Cream' }, { e: '🍰', n: 'Cake' }, { e: '🥐', n: 'Pastries' }, { e: '🍫', n: 'Chocolate' }] }
];

// Generic "vibe" presets shown on the details step. Selecting one fills the editable field.
const ACTIVITY_PRESETS = {
    coffee:     ['Downtown café ☕', 'Waterfront coffee walk 🌊', 'Cozy bookshop café 📚', 'Try a new roastery 🔥'],
    drinks:     ['Rooftop bar 🍸', 'Wine bar 🍷', 'Craft cocktails 🍹', 'Casual pints 🍺'],
    dinner:     ['Cozy Italian 🍝', 'Rooftop dinner 🌃', 'Waterfront restaurant 🌊', 'Casual & fun 🍔'],
    bar:        ['Pool & billiards 🎱', 'Sports bar 📺', 'Cocktail lounge 🍸', 'Darts & games 🎯'],
    movie:      ['New release 🎬', 'Cozy indie film 🎞️', 'Dinner + a movie 🍽️', 'Movie night at home 🏠'],
    sports:     ['Tennis match 🎾', 'Morning run 🏃', 'Swim session 🏊', 'Bike ride 🚴'],
    sun:        ['Beach day 🏖️', 'Park & tan ☀️', 'Lakeside lounging 🌊', 'Rooftop sunbathing 🌆'],
    bowling:    ['Classic bowling 🎳', 'Bowling + arcade 🕹️', 'Cosmic night bowling 🌌', 'Friendly tournament 🏆'],
    sunset:     ['Fort Henry lookout 🏰', 'Lakeside sunset 🌊', 'Rooftop sunset 🌇', 'Sunset drive 🚗'],
    nightdrive: ['Scenic route 🛣️', 'City lights tour 🌃', 'Drive + good music 🎵', 'Late-night snack run 🍟'],
    games:      ['Escape room 🔐', 'Board game café 🎲', 'Arcade 🕹️', 'Trivia night 🧠'],
    art:        ['Pottery class 🏺', 'Paint night 🎨', 'Gallery visit 🖼️', 'Craft workshop ✂️'],
    outdoor:    ['Hiking trail 🥾', 'Kayaking 🛶', 'Bike ride 🚲', 'Nature walk 🌲'],
    music:      ['Live band 🎸', 'Jazz night 🎷', 'Open mic 🎤', 'Local gig 🎶'],
    picnic:     ['Lakeside picnic 🌊', 'Park picnic 🌳', 'Sunset picnic 🌇', 'Cheese & wine 🧀']
};

// Cute/flirty teases shown when she keeps chasing the "NO" button — one per 5 tries.
// ~220 lines arranged as an escalating narrative (banter → the button gains a personality
// → 4th-wall → epic saga → philosophical → sweet resolution), so it stays fresh for
// 1,000+ touches before it loops. Generic for a first date or a hundredth.
const NO_TEASES = [
    "Nice try 😏 — but that 'No' is feeling shy today.",
    "You can chase that button all {daypart}, cutie. 💕",
    "Persistent! I already like where this is going. 😍",
    "Aww, still going? Just tap YES already. 🥰",
    "That button has commitment issues. YES doesn't. 💖",
    "Plot twist: there is no 'No'. 😘",
    "Impressive stamina… promising for our date. 😉",
    "The 'No' button is allergic to your finger. 🤧",
    "Careful — all this chasing counts as flirting. 💘",
    "Okay, you win the effort award. Now hit YES. ✨",
    "Still no luck? The button's shy — I'm not. 😌",
    "You + that button = the slowest chase scene ever. 💨",
    "Fun fact: every tap just makes me smile more. 😊",
    "It keeps running… it wants you to work for it. 😏",
    "Ten out of ten for persistence, still no 'No'. 😆",
    "Are we flirting yet? Feels like we're flirting. 😉",
    "That button's cardio is better than mine. 😅",
    "Give up on 'No' — 'Yes' gives way better hugs. 🤗",
    "You're kind of cute when you're stubborn. 😍",
    "Last call: 'No' retired. 'Yes' is right there. 💗",

    // ── Act II: wait… you're STILL going? ──
    "Oh, we're STILL going? Okay, respect. 😳",
    "You realize that button has zero chill, right? 😂",
    "I'd have said yes ages ago, just saying. 😏",
    "The button's getting a workout. So is my heart. 💓",
    "Determined little thing, aren't you? 🥺",
    "You could've planned the whole date by now. 😅",
    "Still no? Bold strategy. Carry on. 😌",
    "This is the most fun I've ever had losing. 😂",
    "The button ran a marathon. You did too. 🏃",
    "I'm starting to think you enjoy the chase. 😉",
    "Every miss is basically a little love tap. 💕",
    "You've got more moves than a chess grandmaster. ♟️",
    "Okay speed-demon, slow down and say yes. 😍",
    "That's a lot of effort to avoid a yes. 🤨",
    "I genuinely admire the commitment. 👏",
    "The 'No' is doing cardio it never signed up for. 😂",
    "Still here? Same. I'm not leaving either. 💘",
    "You've got the reflexes of a cat and the heart of a poet. 🐱",
    "The scoreboard: You 0, Button 47, Cuteness infinite. 📊",
    "I could watch you try this all day. And I might. 😍",
    "Your finger deserves a medal and a nap. 🏅",
    "You're not tired? Good. Neither is my crush on you. 💘",
    "That's try number a-lot. Let's round it up to YES. 😆",
    "Keep going, I'm fully invested now. 🍿",
    "The button is sweating. Metaphorically. 💦",
    "You plus stubbornness equals weirdly attractive. 😏",
    "We're really doing this, huh. Iconic. 💅",
    "Your determination is showing. It's adorable. 🥰",
    "Somebody REALLY wants to press No. Or does she? 😉",
    "Ten more and I'm framing this whole moment. 🖼️",
    "Your persistence just leveled up. Again. 📈",
    "I fell for you approximately 100 taps ago. 💞",
    "This is aggressively adorable. Please continue. 😅",
    "You could power a small city with this. ⚡",
    "I didn't know stubborn could be this cute. 🥰",
    "You've got main-character energy right now. 🌟",
    "This chase has more chemistry than a lab. 🧪",
    "The 'No' is fast, but love is faster. 💨",
    "Careful, you're making the button jealous of Yes. 😏",
    "Round 50 and still undefeated in cuteness. 🥇",
    "You're one tap away from a great story to tell. 📸",
    "Honestly, this is the best date warm-up ever. 🔥",
    "You've got the patience of a saint and the aim of a toddler. 😂",
    "I keep waiting for you to give up. I keep being wrong. 😍",
    "This is your cardio for the week. You're welcome. 🏃",
    "Still chasing? You're my favorite kind of trouble. 😏",
    "I could get used to being chased like this. 💘",
    "Impressive. Most impressive. 🌌",
    "At this point the button owes YOU a date. 😂",
    "The button and I have a bet on how long you'll last. 🤝",

    // ── Act III: the button develops a personality ──
    "The button says it's not you… okay it IS you. 😂",
    "Poor 'No' just wants to be left alone. 🥲",
    "The button is shy. Give it space, give ME a yes. 😏",
    "'No' has trust issues. 'Yes' is an open book. 📖",
    "The button practiced dodging all week for this. 🤸",
    "Breaking: local button afraid of commitment. 📰",
    "That button has a black belt in avoidance. 🥋",
    "The 'No' unionized. It refuses to be clicked. ✊",
    "The button's therapist says it fears being pressed. 🛋️",
    "'No' is allergic to your charm. Understandable. 💅",
    "The button is doing its little dance for you. 💃",
    "Aww, 'No' is scared. 'Yes' is brave and cute. 😌",
    "That button just wants to see you smile. Working? 😊",
    "The 'No' is ticklish; every tap makes it giggle-run. 🤭",
    "The 'No' says hi, and also: no. 👋",
    "That button moonlights as an Olympic sprinter. 🥇",
    "'No' is emotionally unavailable. 'Yes' texts back. 📱",
    "The 'No' just texted 'Yes' for backup. 📲",
    "Button résumé: Professional Escape Artist. 🎩",
    "The 'No' has left the building. And the timezone. 🌍",
    "It's not dodging, it's social distancing. 😷",
    "The button values its personal space. YES doesn't. 🤗",
    "'No' is in its flop era. 'Yes' is thriving. 💅",
    "That 'No' has the survival instincts of a cockroach. 😂",
    "The button whispered 'catch me if you can'. Rude. 😤",
    "'No' is speedrunning away from you. New record. ⏱️",
    "The button applied for witness protection. 🕶️",
    "The 'No' is now legally considered a myth. 🦄",
    "The button just aged ten years dodging you. 👴",
    "The 'No' has entered its villain arc. 🦹",
    "Every dodge is the button flirting back, clearly. 😉",
    "The button's motto: born to run, refuse to be won. 🎸",
    "The 'No' is basically doing parkour now. 🤸",
    "The 'No' filed a noise complaint about all this love. 📣",
    "That button has more escape routes than a heist movie. 🎬",
    "The 'No' is playing hard to get — learned from a pro? 😉",
    "Button status: terrified, cornered, still uncatchable. 😆",
    "The 'No' would like to remind you it has feelings too. 🥹",
    "The button's cardio is genuinely better than mine. 😅",
    "The 'No' packed a bag and moved to another card. 🧳",

    // ── Act IV: breaking the fourth wall ──
    "Between us? The dev rigged this. 'No' never worked. 🤫",
    "Fun secret: there's basically no code behind 'No'. 😏",
    "Somewhere a programmer is laughing. Lovingly. 💻",
    "This button was literally built to run. Sorry not sorry. 🏃",
    "Spoiler: the only working button is the pretty one. ✨",
    "The 'No' is decorative. Purely vibes. 🎨",
    "Plot twist the writers warned you about: it's YES or YES. 😆",
    "You found the game's final boss. It's a button. 🎮",
    "Achievement unlocked: Persistent Heart. 🏆",
    "Working as intended, cutie. This is a feature. ⚙️",
    "Cheat code for 'No': …does not exist. Try YES. 🕹️",
    "The button's AI has one rule: do not get caught. 🤖",
    "Narrator: the 'No' would not be clicked that day. 🎙️",
    "You've entered a loop with one exit. It's YES. 🔁",
    "Somewhere a git commit is snickering. 😅",
    "The dev added hundreds of these hoping you'd stop. 😂",
    "Yep, there are literally hundreds of lines. Test me. 📜",
    "The changelog just says: 'made No impossible'. ✅",
    "You're stress-testing the button. It's failing gloriously. 🧪",
    "Somewhere in the code, a comment reads: good luck. 😏",
    "This button has more escape logic than a heist film. 🌀",
    "Easter egg: the 'No' will NEVER be yours. 🥚",
    "This tantrum was pre-tested by QA. You're on brand. 😂",
    "The physics engine ships with a fleeing 'No'. On purpose. ⚙️",
    "Breaking the fourth wall to say: just tap YES, love. 💗",
    "Legally, I must inform you the 'No' is a decoy. ⚖️",
    "The button pays rent just to run away from you. 🏠",
    "You plus a rigged button equals a love story with plot holes. 🕳️",
    "The source code sends its regards. And a wink. 😉",
    "Zero percent chance, infinite charm. Choose YES. ✨",

    // ── Act V: the epic saga ──
    "Bards will sing of the Great No Chase. 🎶",
    "This is an epic now — you're the hero, the button's the dragon. 🐉",
    "Historians will call this the Hundred Taps' War. ⚔️",
    "You've trained harder than a movie montage. 🎬",
    "Somewhere, Rocky is proud. 🥊",
    "A saga for the ages: Heart vs Button. 📜",
    "You've out-persisted every rom-com lead. 🍿",
    "The council of buttons convened. They're impressed. 🏛️",
    "Legends whisper of the one who never gave up. 🌌",
    "This belongs in a museum of devotion. 🖼️",
    "You've unlocked 'Relentless Romantic' status. 💫",
    "Even the stars are rooting for you now. ⭐",
    "This is your villain-origin story, but make it cute. 💕",
    "The button trembles before your resolve. 😳",
    "You're basically the Chosen One of clicking. 🗡️",
    "The prophecy said a yes would end the chase. 🔮",
    "Marathon runners are taking notes. 🏅",
    "This is the boss fight. YES is the victory screen. 🎉",
    "They'll teach this chase in flirting school. 🎓",
    "You vs Button: the trilogy everybody secretly loves. 🎬",
    "This is Everest. The summit is a YES. 🏔️",
    "Odysseus took ten years. You're catching up. ⛵",
    "Cue the training-montage music one more time. 🎵",
    "Somewhere a war drum beats for your persistence. 🥁",
    "The hall of fame called; you're inducted. 🏛️",
    "This chase has three acts and you're the whole cast. 🎭",
    "The button is the final level; you're out of lives, only love. ❤️",
    "Ballads will rhyme 'No' with 'oh no'. 🎵",
    "You've earned a statue in the town square. 🗿",
    "The gods of romance are thoroughly entertained. 🌩️",
    "Future generations will study your grip strength. 💪",
    "The button surrenders in the sequel. Spoilers. 🏳️",
    "You're writing the greatest chase since cat versus laser. 🐈",
    "Somewhere, an orchestra swells just for you. 🎻",
    "This is the montage; the payoff is a date. 🎬",

    // ── Act VI: getting philosophical about it ──
    "What even IS a 'No', if it can never be caught? 🤔",
    "The button teaches patience. And flirting. 🧘",
    "Sisyphus had a rock; you have a button. Push on. ⛰️",
    "To chase 'No' is to secretly want 'Yes'. Deep. 🌀",
    "I chase, therefore I flirt. — Descartes, probably. 🧠",
    "The 'No' is a state of mind. Change it — tap YES. ✨",
    "Somewhere between tap 90 and now, this became love. 💭",
    "Honestly, the journey IS the date. 🛤️",
    "If a 'No' dodges in a forest, is it even a 'No'? 🌲",
    "Zen master says: stop chasing, start dating. ☯️",
    "The universe is hinting. It rhymes with 'best'. 😉",
    "Every great love story starts with a chase. 📖",
    "Schrödinger's button: both No and Yes till you pick Yes. 📦",
    "The real 'No' was the memories we made along the way. 😂",
    "In another universe you clicked it. That universe is boring. 🌌",
    "The button is a mirror; it shows how much you care. 🪞",
    "Chase long enough and 'No' becomes 'kNOw you like me'. 😏",
    "Perhaps 'No' was never meant to be caught, only chased. 🌙",
    "Time is a flat circle, and so is this button. 🔵",
    "The softer you tap, the more it runs — ancient dating tao. ☯️",

    // ── Act VII: sweet resolution ──
    "Okay, you've officially proven it. I'm charmed. 🥰",
    "You had me at tap one, honestly. 💗",
    "Fine, fine — you win my whole heart. Now YES? 😍",
    "I already knew your answer. Did you? 😉",
    "All this just to spend time with me? Swoon. 🫠",
    "Consider me thoroughly, hopelessly flattered. 💞",
    "The button surrenders. So do I. ❤️",
    "You didn't need to convince me — but wow, you did. ✨",
    "This is the cutest 'yes in disguise' I've ever seen. 🥹",
    "Come here, you persistent sweetheart. Tap YES. 🤗",
    "My heart's doing the fluttery thing. 🦋",
    "You're impossible. In the very best way. 💕",
    "The chase was cute, but I want the actual date. 😘",
    "Let's stop teasing and start planning, yeah? 🥂",
    "You plus me beats you plus this button. Always. 💘",
    "I'd chase you right back, for the record. 😏",
    "Deal: one more tap and it magically becomes YES. 🪄",
    "You've earned the date and the bragging rights. 🏆",
    "Alright, softie — I'm saying yes for both of us. 😄",
    "Whenever you're ready, that YES is glowing for you. ✨",
    "Okay my heart can't take this much cuteness. YES? 🫠",
    "You've melted me into a little puddle. 💕",
    "Truce? You get the date, I get to keep smiling. 🤝",
    "You're the only thing I'd ever chase back. 💘",
    "Come on, cutie — let's go be a 'yes' together. ✨"
];

// Shown if she tries to go Back to the YES/NO screen — that "yes" is final. 💕
const NO_BACK_MESSAGES = [
    "Nope — you already said YES, and there's no take-backs. 😌💕",
    "Sorry cutie, that YES is legally binding now. 📜❤️",
    "No going back! You're officially stuck on a date with me. 😘",
    "That door locked the moment you said yes. Onward! 🔒💘",
    "A yes is a yes 💍 — no escaping this date now.",
    "Once you're in, you're in. Lucky me. 🥰",
    "Can't undo a yes, sweetheart. Let's keep planning. ✨"
];

// --------------------------------------------------------------------------
// 2. SYSTEM INFO DETECTOR
// --------------------------------------------------------------------------
class SystemDetector {
    static async getInfo() {
        const ua = navigator.userAgent;
        const plat = navigator.platform || '';
        const maxTouch = navigator.maxTouchPoints || 0;
        const uaData = navigator.userAgentData || null;   // Chromium only (Chrome/Edge/Android/ChromeOS)

        // Try high-entropy Client Hints first — most accurate OS + device model on Chromium.
        let ch = null, chPlatform = '', chVersion = '', model = '';
        if (uaData) {
            chPlatform = uaData.platform || '';
            try {
                ch = await uaData.getHighEntropyValues(['platformVersion', 'model', 'architecture', 'bitness']);
                chVersion = ch.platformVersion || '';
                model = ch.model || '';
            } catch (e) { /* not available — fall back to UA */ }
        }

        // --- Reliable device-class flags (handles the UA overlaps) ---
        // iPadOS 13+ reports a desktop Mac UA, so detect iPad via touch on a "Mac".
        const isIPadOS = maxTouch > 1 && (/Macintosh|MacIntel/.test(ua) || plat === 'MacIntel');
        const isIPhone = /iPhone|iPod/.test(ua);
        const isIPad   = /iPad/.test(ua) || isIPadOS;
        const isAndroid = /Android/.test(ua) || chPlatform === 'Android';

        // --- OS (check specific mobile OSes BEFORE Linux/Mac, which their UAs also contain) ---
        let os = 'Unknown';
        if (isAndroid) os = 'Android';
        else if (isIPhone) os = 'iOS';
        else if (isIPad) os = 'iPadOS';
        else if (chPlatform === 'Windows' || /Windows NT|Windows/.test(ua)) os = 'Windows';
        else if (chPlatform === 'Chrome OS' || /CrOS/.test(ua)) os = 'ChromeOS';
        else if (chPlatform === 'macOS' || /Mac OS X|Macintosh/.test(ua)) os = 'macOS';
        else if (chPlatform === 'Linux' || /Linux|X11/.test(ua)) os = 'Linux';

        // --- Human-readable OS version ---
        if (chVersion) {
            if (os === 'Windows') {
                // Windows Client-Hints major ≥ 13 ⇒ Windows 11, 1–12 ⇒ Windows 10.
                const major = parseInt(chVersion, 10);
                os = major >= 13 ? 'Windows 11' : (major >= 1 ? 'Windows 10' : 'Windows');
            } else if (os === 'Android' || os === 'ChromeOS' || os === 'macOS') {
                os = `${os} ${chVersion.split('.').slice(0, 2).join('.')}`;
            }
        } else {
            // UA fallbacks for versions Client Hints can't give (iOS/macOS/Safari).
            let m;
            if ((isIPhone || isIPad) && (m = ua.match(/OS (\d+)[._](\d+)/))) os = `${os} ${m[1]}.${m[2]}`;
            else if (os === 'macOS' && (m = ua.match(/Mac OS X (\d+)[._](\d+)/))) os = `macOS ${m[1]}.${m[2]}`;
            else if (os === 'Android' && (m = ua.match(/Android (\d+(?:\.\d+)?)/))) os = `Android ${m[1]}`;
        }

        // --- Device class ---
        let device = 'Desktop';
        if (isIPad) device = 'Tablet';
        else if (isIPhone) device = 'Mobile';
        else if (uaData && typeof uaData.mobile === 'boolean') {
            device = uaData.mobile ? 'Mobile' : 'Desktop';
            if (isAndroid && !uaData.mobile) device = 'Tablet'; // Android non-mobile ⇒ tablet
        } else if (isAndroid) {
            device = /Mobile/.test(ua) ? 'Mobile' : 'Tablet'; // Android tablets omit "Mobile"
        } else if (/Mobi/.test(ua)) device = 'Mobile';
        else if (/Tablet/.test(ua)) device = 'Tablet';

        // --- Browser (order matters; iOS wrappers keep "Safari" in their UA) ---
        let browser = 'Unknown';
        if (/\bOPR\b|OPiOS|Opera/.test(ua)) browser = 'Opera';
        else if (/Edg\/|EdgA\/|EdgiOS\//.test(ua)) browser = 'Edge';
        else if (/SamsungBrowser/.test(ua)) browser = 'Samsung Internet';
        else if (/CriOS\//.test(ua)) browser = 'Chrome';        // Chrome on iOS
        else if (/FxiOS\//.test(ua)) browser = 'Firefox';       // Firefox on iOS
        else if (/Firefox\//.test(ua)) browser = 'Firefox';
        else if (/Chrome\//.test(ua)) browser = 'Chrome';
        else if (/Safari\//.test(ua)) browser = 'Safari';

        const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection || {};

        return {
            os, browser, device,
            model: model || '',
            architecture: ch ? [ch.architecture, ch.bitness].filter(Boolean).join(' ') : '',
            language: navigator.language,
            languages: (navigator.languages || []).join(', '),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            screenRes: `${screen.width}x${screen.height}`,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            pixelRatio: window.devicePixelRatio,
            colorDepth: `${screen.colorDepth}-bit`,
            orientation: (screen.orientation && screen.orientation.type) || 'unknown',
            touchPoints: maxTouch,
            cpuCores: navigator.hardwareConcurrency || 'unknown',
            deviceMemory: navigator.deviceMemory ? `${navigator.deviceMemory} GB` : 'unknown',
            connection: conn.effectiveType || 'unknown',
            online: navigator.onLine,
            cookiesEnabled: navigator.cookieEnabled,
            referrer: document.referrer || 'direct',
            url: window.location.href,
            userAgent: ua,
            localTime: new Date().toLocaleString(),
            timestamp: Date.now()
        };
    }
}

// Format a 24-hour "HH:MM" string as friendly 12-hour "h:MM AM/PM" for display.
function fmtTime12(t) {
    if (!t) return t;
    const [h, m] = t.split(':').map(Number);
    const ampm = h < 12 ? 'AM' : 'PM';
    const hr = (h % 12) || 12;
    return `${hr}:${String(m).padStart(2, '0')} ${ampm}`;
}

// The Cloudflare Worker endpoint (Telegram + calendar + availability).
const WORKER_URL = "https://date-night-arshia.arshia-tehrani1380.workers.dev/";

// Dates/times are interpreted in the date's timezone (Kingston = America/Toronto).
const EVENT_TZ = 'America/Toronto';
function tzOffsetMinutes(dateObj) {
    const dtf = new Intl.DateTimeFormat('en-US', {
        timeZone: EVENT_TZ, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
    const q = {};
    for (const part of dtf.formatToParts(dateObj)) q[part.type] = part.value;
    const asUTC = Date.UTC(+q.year, +q.month - 1, +q.day, +q.hour, +q.minute, +q.second);
    return Math.round((asUTC - dateObj.getTime()) / 60000); // minutes, negative = west
}
// UTC-offset string (e.g. "-04:00") for a Toronto wall-clock moment.
function tzOffsetString(y, mo, d, h, m) {
    let off = tzOffsetMinutes(new Date(Date.UTC(y, mo - 1, d, h, m)));
    const sign = off <= 0 ? '-' : '+';
    off = Math.abs(off);
    return `${sign}${String(Math.floor(off / 60)).padStart(2, '0')}:${String(off % 60).padStart(2, '0')}`;
}
// Epoch ms for a Toronto wall-clock time.
function tzMs(y, mo, d, h, m) {
    const approx = Date.UTC(y, mo - 1, d, h, m);
    return approx - tzOffsetMinutes(new Date(approx)) * 60000;
}

// --------------------------------------------------------------------------
// GOOGLE CALENDAR LINK BUILDER (shared)
// `withName` = who the date is "with" from the calendar owner's point of view.
// --------------------------------------------------------------------------
// Raw event fields for the current AppState. `withName` = who the date is "with"
// from the calendar owner's point of view (falsy => plain "Date").
function calendarFields(withName) {
    const pad = (n) => String(n).padStart(2, '0');
    const [y, m, d] = (AppState.date || '').split('-').map(Number);
    const [hh, mm] = (AppState.time || '').split(':').map(Number);
    const start = new Date(y, m - 1, d, hh, mm);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // 2-hour date

    const title = withName
        ? `Date with ${withName} ❤️ · ${AppState.activity}`
        : `Date ❤️ · ${AppState.activity}`;
    const details = `Our date! Plan: ${AppState.activity}` +
        (AppState.food ? ` | Food: ${AppState.food}` : '') +
        (AppState.planNotes ? ` | Notes: ${AppState.planNotes}` : '') +
        (AppState.dateNote ? ` | Her note: ${AppState.dateNote}` : '') +
        ` | Excitement: ${AppState.excitement}/100 💕`;

    // RFC3339 with Toronto offset, e.g. 2026-07-25T20:30:00-04:00 (absolute — for the Calendar API).
    const rfc = (dt) =>
        `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}` +
        `T${pad(dt.getHours())}:${pad(dt.getMinutes())}:00` +
        tzOffsetString(dt.getFullYear(), dt.getMonth() + 1, dt.getDate(), dt.getHours(), dt.getMinutes());
    // Compact "floating" form for the render URL, e.g. 20260725T203000.
    const compact = (dt) =>
        `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}` +
        `T${pad(dt.getHours())}${pad(dt.getMinutes())}00`;

    return { start, end, title, details, location: 'Kingston, Ontario', rfc, compact };
}

function googleCalUrl(withName) {
    if (!AppState.date || !AppState.time) return '#';
    const f = calendarFields(withName);
    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: f.title,
        dates: `${f.compact(f.start)}/${f.compact(f.end)}`,
        details: f.details,
        location: f.location
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// --------------------------------------------------------------------------
// 3. TELEGRAM INTEGRATION
// --------------------------------------------------------------------------
class TelegramService {
    static async sendPayload() {
        const sys = await SystemDetector.getInfo();
        // A calendar link for YOU: "Date with <name>" if you used ?to=, else just "Date".
        const myCalUrl = googleCalUrl(AppState.recipient);

        const plannerLine = AppState.planner === 'me'
            ? '🧭 Planner: Arshia (she just relaxes)\n'
            : AppState.planner === 'her'
                ? '🧭 Planner: She insisted on planning\n'
                : '';

        const message = `❤️ New Date Accepted ❤️
${AppState.recipient ? `👤 Invited: ${AppState.recipient}\n` : ''}📅 Date: ${AppState.date}
🕒 Time: ${fmtTime12(AppState.time)}
🎯 Plan: ${AppState.activity}
${plannerLine}${AppState.food ? `🍽️ Food: ${AppState.food}\n` : ''}${AppState.planNotes ? `📝 Notes: ${AppState.planNotes}\n` : ''}${AppState.dateNote ? `💌 Her note: ${AppState.dateNote}\n` : ''}🔥 Excitement: ${AppState.excitement}/100
📅 Add to your calendar: ${myCalUrl}

📱 Device: ${sys.device}${sys.model ? ` (${sys.model})` : ''}
🌐 Browser: ${sys.browser}
💻 OS: ${sys.os}${sys.architecture ? ` · ${sys.architecture}` : ''}
🖥️ Screen: ${sys.screenRes} (viewport ${sys.viewport}, ${sys.pixelRatio}x)
🎨 Color depth: ${sys.colorDepth}
📐 Orientation: ${sys.orientation}
✋ Touch points: ${sys.touchPoints}
⚙️ CPU cores: ${sys.cpuCores} | Memory: ${sys.deviceMemory}
📶 Connection: ${sys.connection} | Online: ${sys.online}
🍪 Cookies: ${sys.cookiesEnabled}
🗣️ Language: ${sys.language} (${sys.languages})
🌍 Timezone: ${sys.timezone}
🕰️ Local Time: ${sys.localTime}
🔗 Referrer: ${sys.referrer}
🌐 URL: ${sys.url}`;

        const workerURL = WORKER_URL;

        // Event fields for YOUR calendar — the Worker checks availability, then creates it.
        const f = calendarFields(AppState.recipient);
        const query = new URLSearchParams({
            text: message,
            evTitle: f.title,
            evStart: f.rfc(f.start),
            evEnd: f.rfc(f.end),
            evDesc: f.details,
            evLoc: f.location
        });

        // Normal (CORS) fetch so we can READ the result — the Worker sets Access-Control-Allow-Origin: *.
        try {
            const resp = await fetch(`${workerURL}?${query.toString()}`, { method: 'GET' });
            return await resp.json().catch(() => ({ conflict: false }));
        } catch (error) {
            console.error("Transmission failed:", error);
            return { error: true }; // hard network failure -> let the user retry
        }
    }
}

// --------------------------------------------------------------------------
// 4. PARTICLE PHYSICS ENGINE
// --------------------------------------------------------------------------
class ParticleEngine {
    constructor() {
        this.container = document.getElementById('particle-container');
        this.particles = [];
        this.animationId = null;
        this.active = false;
    }

    createRain(emojis) {
        this.active = true;
        const count = window.innerWidth < 600 ? 50 : 100;

        for (let i = 0; i < count; i++) {
            this.spawnParticle(emojis);
        }
        this.animate();
    }

    spawnParticle(emojis) {
        const el = document.createElement('div');
        el.className = 'particle';
        el.innerText = emojis[Math.floor(Math.random() * emojis.length)];

        const size = Math.random() * 35 + 15;
        const x = Math.random() * window.innerWidth;
        const y = -50 - Math.random() * 150;

        const particleObj = {
            el: el, x: x, y: y, size: size,
            speedY: Math.random() * 4 + 2,
            speedX: (Math.random() - 0.5) * 2,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 6
        };

        el.style.fontSize = `${size}px`;
        el.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${particleObj.rotation}deg)`;

        this.container.appendChild(el);
        this.particles.push(particleObj);
    }

    animate = () => {
        if (!this.active) return;

        const h = window.innerHeight;
        const w = window.innerWidth;

        for (let i = 0; i < this.particles.length; i++) {
            let p = this.particles[i];
            p.y += p.speedY;
            p.x += p.speedX;
            p.rotation += p.rotationSpeed;
            p.x += Math.sin(p.y * 0.015) * 0.8; // Smooth wobble

            p.el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) rotate(${p.rotation}deg)`;

            if (p.y > h + 50) {
                p.y = -50;
                p.x = Math.random() * w;
            }
        }
        this.animationId = requestAnimationFrame(this.animate);
    }
}
const Particles = new ParticleEngine();

// --------------------------------------------------------------------------
// 5. NO BUTTON DODGE LOGIC
// The button flees the cursor *before* contact using a proximity radius on a
// document-level mousemove, so it can never be hovered or held. Motion is a
// smooth glide (CSS transition on left/top), not a jittery per-pixel jump.
// --------------------------------------------------------------------------
class DodgeMechanic {
    constructor(btnElement, onTry) {
        this.btn = btnElement;
        this.onTry = onTry || null; // called with the running "try" count
        this.tries = 0;
        this.lastTry = 0;
        this.playfield = document.getElementById('main-card'); // stays inside the card = always visible
        this.hitMargin = 12;    // px: only flee when the cursor is basically on the button (small margin)
        this.step = 150;        // px: gentle move distance (no big teleports)
        this.pad = 8;           // keep fully inside the card
        this.placed = false;

        this.onMove = this.onMove.bind(this);
        this.onTouch = this.onTouch.bind(this);

        document.addEventListener('mousemove', this.onMove, { passive: true });
        this.btn.addEventListener('mouseenter', this.onMove, { passive: true });
        this.btn.addEventListener('touchstart', this.onTouch, { passive: false });
    }

    destroy() {
        document.removeEventListener('mousemove', this.onMove);
        // If we relocated the button onto <body>, remove that stray copy.
        if (this.placed && this.btn.parentNode === document.body) {
            this.btn.parentNode.removeChild(this.btn);
        }
    }

    rect() { return this.btn.getBoundingClientRect(); }

    // Bounds (in viewport coords) the button may occupy — the card's inner area.
    bounds() {
        const r = this.rect();
        const c = this.playfield.getBoundingClientRect();
        return {
            minX: c.left + this.pad,
            maxX: c.right - r.width - this.pad,
            minY: c.top + this.pad,
            maxY: c.bottom - r.height - this.pad,
            w: r.width,
            h: r.height
        };
    }

    // True only when the cursor is over the button's box, grown by a small margin.
    over(cx, cy, m) {
        const r = this.rect();
        return cx >= r.left - m && cx <= r.right + m && cy >= r.top - m && cy <= r.bottom + m;
    }

    onMove(e) {
        if (!document.body.contains(this.btn)) { this.destroy(); return; }
        if (this.over(e.clientX, e.clientY, this.hitMargin)) {
            this.flee(e.clientX, e.clientY);
        }
    }

    onTouch(e) {
        e.preventDefault();
        const t = e.touches[0] || {};
        this.flee(t.clientX || 0, t.clientY || 0);
    }

    flee(cx, cy) {
        // Count a "try" — debounced so one continuous lunge isn't counted many times.
        const now = Date.now();
        if (now - this.lastTry > 300) {
            this.lastTry = now;
            this.tries += 1;
            if (this.onTry) this.onTry(this.tries);
        }

        const b = this.bounds();
        const clamp = (v, lo, hi) => Math.max(lo, Math.min(v, hi));
        const r = this.rect();

        // Glide directly away from the cursor by a gentle step, clamped inside the card.
        const ang = Math.atan2((r.top + r.height / 2) - cy, (r.left + r.width / 2) - cx);
        let nx = clamp(r.left + Math.cos(ang) * this.step, b.minX, b.maxX);
        let ny = clamp(r.top + Math.sin(ang) * this.step, b.minY, b.maxY);

        // If the cursor would still be over the button after moving (cornered), slide to
        // whichever card corner is farthest from the cursor — smooth and stays visible.
        const stillOver = cx >= nx - this.hitMargin && cx <= nx + b.w + this.hitMargin &&
                          cy >= ny - this.hitMargin && cy <= ny + b.h + this.hitMargin;
        if (stillOver) {
            const corners = [
                [b.minX, b.minY], [b.maxX, b.minY],
                [b.minX, b.maxY], [b.maxX, b.maxY]
            ];
            let best = corners[0], bestD = -1;
            for (const [tx, ty] of corners) {
                const d = Math.hypot((tx + b.w / 2) - cx, (ty + b.h / 2) - cy);
                if (d > bestD) { bestD = d; best = [tx, ty]; }
            }
            [nx, ny] = best;
        }

        this.setPos(nx, ny);
    }

    setPos(x, y) {
        if (!this.placed) {
            // Capture the on-screen spot BEFORE moving, so there's no visual jump.
            const r = this.rect();
            // Relocate onto <body>: the card's backdrop-filter turns it into a containing
            // block for fixed children (and clips them), so a card-child button would vanish.
            // On <body> (no filter/transform) position:fixed is truly viewport-relative.
            document.body.appendChild(this.btn);
            this.btn.style.transition = 'none';
            this.btn.style.position = 'fixed';
            this.btn.style.margin = '0';
            this.btn.style.transform = 'none';
            this.btn.style.zIndex = '9999';
            this.btn.style.left = `${r.left}px`;
            this.btn.style.top = `${r.top}px`;
            void this.btn.offsetWidth; // force reflow so the start point registers
            this.btn.style.transition = 'left 0.22s cubic-bezier(0.25,0.46,0.45,0.94), top 0.22s cubic-bezier(0.25,0.46,0.45,0.94)';
            this.placed = true;
        }
        this.btn.style.left = `${x}px`;
        this.btn.style.top = `${y}px`;
    }
}

// --------------------------------------------------------------------------
// 6. UI CONTROLLER (View Router)
// --------------------------------------------------------------------------
class UIController {
    constructor() {
        this.container = document.getElementById('view-container');
        this.backBtn = document.getElementById('backBtn');
        this.dodge = null;
        this.stack = [];          // history of previous steps {templateId, binder}
        this.currentStep = null;
        this.parseRecipient();
        this.backBtn.addEventListener('click', () => this.back());
        this.init();
    }

    // Read ?to=Name from the URL (you set this when you share the link — nobody is asked).
    parseRecipient() {
        const raw = new URLSearchParams(window.location.search).get('to') || '';
        let name = raw.trim().replace(/[<>]/g, '').slice(0, 40); // sanitize + cap length
        if (name) {
            name = name.charAt(0).toUpperCase() + name.slice(1);
            AppState.recipient = name;
            document.title = `For ${name} ❤️`;
        }
    }

    init() {
        this.show('tpl-invite', this.bindInviteEvents.bind(this), { reset: true });
    }

    // Render a template and run its binder. Low-level (no history changes).
    renderView(templateId, binder) {
        if (this.dodge) { this.dodge.destroy(); this.dodge = null; } // clean up between views
        this.container.innerHTML = '';
        const template = document.getElementById(templateId);
        this.container.appendChild(template.content.cloneNode(true));
        if (binder) binder();
        this.updateBackButton();
    }

    // Navigate forward to a new step (pushes the current step onto history).
    show(templateId, binder, opts = {}) {
        if (opts.reset) this.stack = [];
        else if (this.currentStep) this.stack.push(this.currentStep);
        this.currentStep = { templateId, binder };
        this.renderView(templateId, binder);
    }

    // Navigate back to the previous step — but the YES/NO screen is a one-way door.
    back() {
        if (!this.stack.length) return;
        const prev = this.stack[this.stack.length - 1];
        if (prev.templateId === 'tpl-invite') {
            // She said yes — no take-backs. Tease her instead of navigating.
            this._noBackIdx = (this._noBackIdx || 0);
            this.showToast(NO_BACK_MESSAGES[this._noBackIdx % NO_BACK_MESSAGES.length]);
            this._noBackIdx++;
            return;
        }
        this.currentStep = this.stack.pop();
        this.renderView(this.currentStep.templateId, this.currentStep.binder);
    }

    updateBackButton() {
        this.backBtn.style.display = this.stack.length ? 'flex' : 'none';
    }

    // A little pink toast pill near the top of the card.
    showToast(msg) {
        let t = document.getElementById('dateToast');
        if (!t) {
            t = document.createElement('div');
            t.id = 'dateToast';
            t.className = 'date-toast';
            document.getElementById('main-card').appendChild(t);
        }
        t.textContent = msg;
        clearTimeout(this._toastTimer);
        requestAnimationFrame(() => t.classList.add('show'));
        this._toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
    }

    // --- View 1: Invite -----------------------------------------------------
    bindInviteEvents() {
        const btnYes = document.getElementById('btnYes');
        const btnNo = document.getElementById('btnNo');

        // Personalize the question if the link carried a name (?to=Name).
        if (AppState.recipient) {
            const title = document.getElementById('inviteTitle');
            if (title) title.innerText = `${AppState.recipient}, will you go on a date with me? 🌸`;
        }

        // Tease her when she keeps chasing "NO" — a new cute line every 10 tries.
        const tease = document.getElementById('noTease');
        const onTry = (tries) => {
            if (!tease || tries < 5 || tries % 5 !== 0) return;
            const hr = new Date().getHours();
            const daypart = (hr >= 6 && hr < 18) ? 'day' : 'night'; // her local time
            tease.innerText = NO_TEASES[(tries / 5 - 1) % NO_TEASES.length].replace('{daypart}', daypart);
            tease.classList.remove('pop');
            void tease.offsetWidth; // restart the little pop animation
            tease.classList.add('pop');
        };
        this.dodge = new DodgeMechanic(btnNo, onTry);

        btnYes.addEventListener('click', () => {
            this.show('tpl-activity', this.bindActivityEvents.bind(this));
        });
    }

    // --- View 2: Activity ---------------------------------------------------
    bindActivityEvents() {
        const grid = document.getElementById('activity-grid');

        grid.addEventListener('click', (e) => {
            const btn = e.target.closest('.grid-btn');
            if (!btn) return;

            const special = btn.getAttribute('data-special');
            if (special === 'he-plans') { this.show('tpl-plan-he', this.bindHePlan.bind(this)); return; }
            if (special === 'she-plans') { this.show('tpl-plan-she', this.bindShePlan.bind(this)); return; }

            grid.querySelectorAll('.grid-btn').forEach((b) => b.classList.remove('selected'));
            btn.classList.add('selected');

            AppState.activity = btn.getAttribute('data-value');
            AppState.activityKey = btn.getAttribute('data-ekey') || 'default';
            const emojiSpan = btn.querySelector('.tile-emoji');
            AppState.activityEmoji = emojiSpan ? emojiSpan.innerText : '💕';
            AppState.needsFood = AppState.activityKey === 'dinner';
            // Leaving the dinner branch: drop any stale food so it can't pollute the summary/payload.
            if (!AppState.needsFood) { AppState.food = null; AppState.cuisineKey = null; AppState.foodEmojis = []; }
            AppState.planner = null;
            AppState.planNotes = null;

            grid.style.pointerEvents = 'none'; // ignore rapid double-clicks during the transition
            setTimeout(() => {
                this.show('tpl-activity-edit', this.bindActivityEdit.bind(this));
            }, 250);
        });
    }

    // --- View 2b: Tweak activity (preset vibes + free text) ----------------
    bindActivityEdit() {
        const input = document.getElementById('activityEdit');
        const btn = document.getElementById('btnActivityNext');
        const badge = document.getElementById('editEmoji');
        const list = document.getElementById('activityPresets');

        // The category emoji stays put — it's part of the category.
        badge.innerText = AppState.activityEmoji || '💕';
        input.value = AppState.activity;

        // Generic "vibe" options to pick from.
        const presets = ACTIVITY_PRESETS[AppState.activityKey] || [];
        list.innerHTML = '';
        presets.forEach((p) => {
            const b = document.createElement('button');
            b.className = 'option-item';
            b.innerText = p;
            if (p === AppState.activity) b.classList.add('selected');
            b.addEventListener('click', () => {
                list.querySelectorAll('.option-item').forEach((x) => x.classList.remove('selected'));
                b.classList.add('selected');
                input.value = p;              // selecting a vibe changes the detail...
                AppState.activity = p;        // ...but the category emoji badge stays
            });
            list.appendChild(b);
        });

        const proceed = () => {
            const v = input.value.trim();
            if (v) AppState.activity = v;
            if (AppState.needsFood) {
                this.show('tpl-food-cuisine', this.bindFoodCuisine.bind(this));
            } else {
                this.show('tpl-datetime', this.bindDateTimeEvents.bind(this));
            }
        };
        btn.addEventListener('click', proceed);
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') proceed(); });
    }

    // --- View 2c: He plans --------------------------------------------------
    bindHePlan() {
        if (AppState.planner !== 'me') AppState.planNotes = null; // don't carry the other mode's notes
        AppState.planner = 'me';
        AppState.activity = 'Let me plan it — a surprise 💫';
        AppState.activityKey = 'heplans';
        AppState.needsFood = false;
        AppState.food = null; AppState.cuisineKey = null; AppState.foodEmojis = [];

        const notes = document.getElementById('hePlanNotes');
        if (AppState.planNotes) notes.value = AppState.planNotes;
        document.getElementById('btnHePlan').addEventListener('click', () => {
            AppState.planNotes = notes.value.trim() || null;
            this.show('tpl-datetime', this.bindDateTimeEvents.bind(this));
        });
    }

    // --- View 2d: She plans -------------------------------------------------
    bindShePlan() {
        if (AppState.planner !== 'her') AppState.planNotes = null; // don't carry the other mode's notes
        AppState.planner = 'her';
        AppState.activity = "You're planning it 📋";
        AppState.activityKey = 'sheplans';
        AppState.needsFood = false;
        AppState.food = null; AppState.cuisineKey = null; AppState.foodEmojis = [];

        const notes = document.getElementById('shePlanNotes');
        if (AppState.planNotes) notes.value = AppState.planNotes;
        document.getElementById('btnShePlan').addEventListener('click', () => {
            AppState.planNotes = notes.value.trim() || null;
            this.show('tpl-datetime', this.bindDateTimeEvents.bind(this));
        });
    }

    // --- View 3a: Food cuisine ---------------------------------------------
    bindFoodCuisine() {
        const grid = document.getElementById('cuisine-grid');
        grid.innerHTML = '';
        CUISINES.forEach((c) => {
            grid.appendChild(this.makeTile(c.emoji, c.name, () => {
                AppState.cuisineKey = c.key;
                this.show('tpl-food-dish', this.bindFoodDish.bind(this));
            }));
        });
    }

    // --- View 3b: Food dish -------------------------------------------------
    bindFoodDish() {
        const c = CUISINES.find((x) => x.key === AppState.cuisineKey) || CUISINES[0];
        document.getElementById('dish-title').innerText = `${c.emoji} ${c.name} — pick a dish`;
        const grid = document.getElementById('dish-grid');
        grid.innerHTML = '';
        c.dishes.forEach((dish) => {
            grid.appendChild(this.makeTile(dish.e, dish.n, () => {
                AppState.food = `${c.name} – ${dish.n} ${dish.e}`;
                AppState.foodEmojis = [c.emoji, dish.e];
                this.show('tpl-datetime', this.bindDateTimeEvents.bind(this));
            }));
        });
    }

    // Build a grid tile with the emoji-on-top / label-below layout.
    makeTile(emoji, label, onClick) {
        const b = document.createElement('button');
        b.className = 'grid-btn';
        b.innerHTML = `<span class="tile-emoji">${emoji}</span><span class="tile-label">${label}</span>`;
        b.addEventListener('click', onClick);
        return b;
    }

    // --- View 4: Date & time -----------------------------------------------
    bindDateTimeEvents() {
        const dateInput = document.getElementById('datePicker');
        const timeSelect = document.getElementById('timeInput');

        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
        const nowMin = now.getHours() * 60 + now.getMinutes();

        // Block past dates in the picker itself.
        dateInput.min = todayStr;

        // Build the full day (30-min steps) once. Value stays 24-hour ("21:00") for the
        // logic; the visible label is friendly 12-hour AM/PM ("9:00 PM") to avoid confusion.
        while (timeSelect.options.length > 1) timeSelect.remove(1);
        for (let h = 0; h <= 23; h++) {
            const hs = pad(h);
            timeSelect.add(new Option(fmtTime12(`${hs}:00`), `${hs}:00`));
            timeSelect.add(new Option(fmtTime12(`${hs}:30`), `${hs}:30`));
        }

        const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

        // Hint helpers.
        const dateField = dateInput.closest('.date-field');
        const syncDateHint = () => { if (dateField) dateField.classList.toggle('empty', !dateInput.value); };
        const syncTimeHint = () => timeSelect.classList.toggle('is-empty', !timeSelect.value);

        // A slot is unavailable if it's in the past (today) OR overlaps a busy calendar block.
        let busyIntervals = []; // [{start, end}] epoch ms for the selected date
        const slotBusy = (value) => {
            if (!dateInput.value || !busyIntervals.length) return false;
            const [y, mo, d] = dateInput.value.split('-').map(Number);
            const [h, m] = value.split(':').map(Number);
            const s = tzMs(y, mo, d, h, m);
            const e = s + 2 * 60 * 60 * 1000; // 2-hour date
            return busyIntervals.some((b) => s < b.end && e > b.start);
        };
        const applyTimeState = () => {
            const isToday = dateInput.value === todayStr;
            for (const opt of timeSelect.options) {
                if (!opt.value) continue;
                const past = isToday && toMin(opt.value) <= nowMin;
                const busy = slotBusy(opt.value);
                opt.hidden = past;                         // past times disappear
                opt.disabled = past || busy;               // busy times shown but not selectable
                opt.text = fmtTime12(opt.value) + (busy ? ' — busy' : '');
                if (opt.disabled && opt.selected) timeSelect.selectedIndex = 0;
            }
            syncTimeHint();
        };
        // Ask the Worker which times you're busy on the chosen day, then grey those out.
        const refreshAvailability = async () => {
            busyIntervals = [];
            const dv = dateInput.value;
            if (dv) {
                const [y, mo, d] = dv.split('-').map(Number);
                try {
                    const q = new URLSearchParams({
                        availability: '1',
                        dayStart: `${dv}T00:00:00${tzOffsetString(y, mo, d, 0, 0)}`,
                        dayEnd: `${dv}T23:59:00${tzOffsetString(y, mo, d, 23, 59)}`
                    });
                    const r = await fetch(`${WORKER_URL}?${q.toString()}`);
                    const j = await r.json();
                    if (Array.isArray(j.busy)) busyIntervals = j.busy;
                } catch (e) { /* fail-open: no greying; the submit-time check still guards */ }
            }
            applyTimeState();
        };

        dateInput.addEventListener('change', () => { applyTimeState(); syncDateHint(); refreshAvailability(); });
        dateInput.addEventListener('input', syncDateHint);
        timeSelect.addEventListener('change', syncTimeHint);

        // Open the calendar when clicking anywhere in the box (like the time dropdown).
        // On a mouse, prevent the default so no date segment gets selected/highlighted;
        // touch/pen keep their native tap behavior (mobile pickers open fine on their own).
        dateInput.addEventListener('pointerdown', (e) => {
            if (e.pointerType === 'mouse') {
                e.preventDefault();
                try { dateInput.showPicker(); } catch (_) { /* older browsers: icon still works */ }
            }
        });
        dateInput.addEventListener('click', () => {
            try { dateInput.showPicker(); } catch (_) { /* already open or unsupported */ }
        });

        // Restore previous choices when arriving via Back, then apply state + fetch availability.
        if (AppState.date) dateInput.value = AppState.date;
        if (AppState.time) timeSelect.value = AppState.time;
        applyTimeState();
        syncDateHint();
        refreshAvailability();

        document.getElementById('btnNextDateTime').addEventListener('click', () => {
            const dateVal = dateInput.value;
            const timeVal = timeSelect.value;

            if (!dateVal || !timeVal) {
                alert("Please select both a date and time so I can plan perfectly! ❤️");
                return;
            }
            if (dateVal < todayStr) {
                alert("That date is in the past — pick today or later! 🗓️");
                return;
            }
            if (dateVal === todayStr && toMin(timeVal) <= nowMin) {
                alert("That time has already passed today — pick a later time! ⏰");
                return;
            }
            if (slotBusy(timeVal)) {
                alert("That time is taken on Arshia's calendar — pick a free one! 🗓️");
                return;
            }

            AppState.date = dateVal;
            AppState.time = timeVal;
            this.show('tpl-excitement', this.bindExcitementEvents.bind(this));
        });
    }

    // --- View 5: Excitement -------------------------------------------------
    bindExcitementEvents() {
        const slider = document.getElementById('excitementSlider');
        const emojiDisplay = document.getElementById('excitementEmoji');
        const btnFinish = document.getElementById('btnFinish');

        const render = (val) => {
            AppState.excitement = val;
            let emoji = '😊', scale = 1;
            if (val < 20) { emoji = '🙂'; scale = 0.85; }
            else if (val < 40) { emoji = '😌'; scale = 0.95; }
            else if (val < 60) { emoji = '😊'; scale = 1.05; }
            else if (val < 80) { emoji = '🥰'; scale = 1.25; }
            else if (val < 95) { emoji = '😍'; scale = 1.45; }
            else { emoji = '🤯❤️'; scale = 1.7; }
            emojiDisplay.innerText = emoji;
            emojiDisplay.style.transform = `scale(${scale})`;
        };

        slider.value = AppState.excitement; // restore on Back
        render(AppState.excitement);
        slider.addEventListener('input', (e) => render(parseInt(e.target.value)));

        const noteEl = document.getElementById('dateNote');
        if (noteEl && AppState.dateNote) noteEl.value = AppState.dateNote; // restore on Back

        btnFinish.addEventListener('click', async () => {
            AppState.dateNote = (noteEl && noteEl.value.trim()) || null; // capture her note
            this.backBtn.style.display = 'none'; // hide Back during the send (don't clear history)
            this.renderView('tpl-loading');      // transient, not a history step
            const result = await TelegramService.sendPayload();

            if (result && result.error) {
                // Network failure — don't show a false success; let her retry.
                this.renderView('tpl-excitement', this.bindExcitementEvents.bind(this));
                alert("Hmm — couldn't send just now. Check your connection and tap Send Invitation again. 💌");
                return;
            }
            if (result && result.conflict) {
                // Arshia is busy then — don't finalize; send her back to pick another time.
                this.back(); // top of the stack is the date/time step
                alert("💔 Aw — Arshia isn't free at that time. Please pick another date or time!");
                return;
            }

            setTimeout(() => {
                this.show('tpl-final', this.bindFinalEvents.bind(this), { reset: true }); // no Back from the end
            }, 1000);
        });
    }

    // --- View 7: Final ------------------------------------------------------
    bindFinalEvents() {
        document.getElementById('final-activity').innerText = AppState.activity;
        document.getElementById('final-time').innerText = `${AppState.date} at ${fmtTime12(AppState.time)}`;

        if (AppState.food) {
            document.getElementById('food-summary-row').style.display = 'flex';
            document.getElementById('final-food').innerText = AppState.food;
        }
        if (AppState.planNotes) {
            document.getElementById('notes-summary-row').style.display = 'flex';
            document.getElementById('final-notes').innerText = AppState.planNotes;
        }

        this.buildCalendarLink();
        this.startCountdown();
        this.loadWeather();

        // Build a diverse, activity-relevant emoji theme for the rain.
        let theme = (ACTIVITY_EMOJIS[AppState.activityKey] || ACTIVITY_EMOJIS.default).slice();
        theme = theme.concat(AppState.foodEmojis || []);
        theme.push('❤️', '💕');
        AppState.emojiTheme = [...new Set(theme)];

        Particles.createRain(AppState.emojiTheme);
    }

    buildCalendarLink() {
        // Her calendar: the date is "with Arshia".
        const link = document.getElementById('gcalLink');
        if (link) link.href = googleCalUrl('Arshia');
    }

    // Live "time until our date" countdown on the final screen.
    startCountdown() {
        const el = document.getElementById('final-countdown');
        if (!el || !AppState.date || !AppState.time) return;
        const [y, mo, d] = AppState.date.split('-').map(Number);
        const [h, m] = AppState.time.split(':').map(Number);
        const target = tzMs(y, mo, d, h, m);
        const tick = () => {
            let diff = target - Date.now();
            if (diff <= 0) { el.innerText = '💕 It\'s date time! 💕'; return; }
            const days = Math.floor(diff / 86400000); diff -= days * 86400000;
            const hrs = Math.floor(diff / 3600000); diff -= hrs * 3600000;
            const mins = Math.floor(diff / 60000);
            const parts = [];
            if (days) parts.push(`${days} day${days > 1 ? 's' : ''}`);
            parts.push(`${hrs} hr${hrs !== 1 ? 's' : ''}`);
            parts.push(`${mins} min`);
            el.innerText = `⏳ ${parts.join(', ')} until our date 💕`;
        };
        tick();
        clearInterval(this._countdownTimer);
        this._countdownTimer = setInterval(tick, 30000);
    }

    // Forecast for the date (free Open-Meteo API; only within its ~16-day window).
    async loadWeather() {
        if (!AppState.date) return;
        const row = document.getElementById('weather-row');
        const out = document.getElementById('final-weather');
        if (!row || !out) return;
        const CODES = {
            0: '☀️ Clear', 1: '🌤️ Mostly clear', 2: '⛅ Partly cloudy', 3: '☁️ Cloudy',
            45: '🌫️ Foggy', 48: '🌫️ Foggy', 51: '🌦️ Light drizzle', 53: '🌦️ Drizzle', 55: '🌧️ Drizzle',
            61: '🌦️ Light rain', 63: '🌧️ Rain', 65: '🌧️ Heavy rain', 71: '🌨️ Light snow', 73: '🌨️ Snow',
            75: '❄️ Heavy snow', 80: '🌦️ Showers', 81: '🌧️ Showers', 82: '⛈️ Heavy showers',
            95: '⛈️ Thunderstorm', 96: '⛈️ Thunderstorm', 99: '⛈️ Thunderstorm'
        };
        try {
            const u = `https://api.open-meteo.com/v1/forecast?latitude=44.23&longitude=-76.48` +
                `&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=America%2FToronto` +
                `&start_date=${AppState.date}&end_date=${AppState.date}`;
            const r = await fetch(u);
            const j = await r.json();
            const daily = j && j.daily;
            if (daily && daily.time && daily.time.length) {
                const code = CODES[daily.weather_code[0]] || '🌡️';
                const hi = Math.round(daily.temperature_2m_max[0]);
                const lo = Math.round(daily.temperature_2m_min[0]);
                out.innerText = `${code}, ${lo}–${hi}°C`;
                row.style.display = 'flex';
            }
        } catch (e) { /* forecast unavailable (too far out or offline) — just hide it */ }
    }

}

// --------------------------------------------------------------------------
// 7. BOOTSTRAP
// --------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    window.app = new UIController();
});
