/* All page copy lives here. content.md is generated from this file (see ../tools/make-content-md.cjs). */
window.CONTENT = {
  phone: "(475) 897-5114",
  phoneHref: "tel:+14758975114",

  teaser: {
    generic: {
      kicker: "Free buyer guide",
      title: "Your home buying game plan",
      body: "The Criterion team's step-by-step guide to buying a home in Connecticut, a 1-minute readiness quiz, and a worksheet for your up-front costs.",
    },
    renter: {
      kicker: "Renting now?",
      title: "See what it takes to buy",
      body: "Take the 1-minute quiz to see where you stand, then walk through every step from pre-approval to keys with the Criterion team's buyer guide.",
    },
    stats: ["9 short steps", "8 questions", "1 cost worksheet"],
    ctaQuiz: "Take the 1-minute quiz",
    ctaUnlock: "Unlock the full guide",
    lockedNote: "Free. We text you a link so you can pick up where you left off.",
  },

  gate: {
    title: "Where should we text your link?",
    titleQuiz: "Your score is ready. Where should we text it?",
    sub: "Unlock the full guide and save your results. We text you a personal link so you can come back anytime.",
    fields: {
      first_name: { label: "First name", placeholder: "First name" },
      phone: { label: "Cell phone", placeholder: "(555) 555-0123" },
      email: { label: "Email", hint: "Optional", placeholder: "you@example.com" },
      town: { label: "Which town interests you most?", options: ["Danbury", "Newtown", "Brookfield", "New Fairfield", "New Milford", "Other"] },
      timeline: { label: "When are you hoping to buy?", options: ["0-3 months", "3-6 months", "6-12 months", "12+ months", "Not sure"] },
      renting: { label: "Renting now?", options: ["Yes", "No"] },
      lender_optin: {
        label: "Have a lending partner reach out to me",
        hint: "Optional. We'll pass your name and number to one lender we work with. You're never required to use any particular lender.",
      },
      sms_consent: {
        label:
          "I agree to receive text messages from the Criterion team at Criterion Real Estate LLC at the cell number above, including my guide link and follow-up about buying a home. Messages may be sent using automated technology. Consent is not a condition of buying any property or service. Message frequency varies. Msg & data rates may apply. Reply STOP to opt out or HELP for help.",
      },
    },
    privacy: "We respect your privacy. We never sell your information.",
    submit: "Text me my link",
    sending: "Sending…",
    errors: {
      first_name: "Please enter your first name.",
      phone: "Please enter a 10-digit cell number.",
      email: "Please enter a valid email, or leave it blank.",
      town: "Please pick a town.",
      timeline: "Please pick a timeline.",
      renting: "Please choose yes or no.",
      sms_consent: "Please check the box so we can text you your link.",
    },
  },

  sent: {
    title: "We just texted you a link",
    body: "It opens your guide, quiz results and worksheet right where you left off. You can also save it now:",
    copy: "Copy my link",
    copied: "Copied",
    noText: "No text in a few minutes? Use the link above, or call us at",
    cta: "Go to my game plan",
  },

  hub: {
    hello: "Hi {name}, here's your game plan",
    helloNoName: "Your game plan",
    guide: { title: "Buyer guide", start: "9 short steps from pre-approval to keys", progress: "Step {n} of {total}", done: "All steps read" },
    quiz: { title: "Readiness quiz", start: "8 questions, about a minute", done: "{score} of 16 · {band}" },
    worksheet: { title: "Up-front cost worksheet", start: "Add up your own numbers", done: "Your total so far: {total}" },
    linkLabel: "Your personal link",
    call: "Questions? Call or text the Criterion team",
  },

  saveSpot: { label: "Save my spot", saved: "Saved. Your link opens right here." },

  guide: [
    {
      kicker: "Step 1",
      title: "How buying a home works",
      intro: "Buying a home happens in steps. Here's the path we'll walk with you, start to finish.",
      list: [
        "Talk to a lender and get pre-approved (or gather proof of funds)",
        "Sit down with us and sign a buyer agreement",
        "Search for homes that fit your must-haves and budget",
        "Make an offer and put down a good-faith deposit",
        "Inspect the home and negotiate repairs",
        "Appraisal, loan approval and title work",
        "Closing with your attorney, then moving day",
      ],
      ordered: true,
    },
    {
      kicker: "Step 2",
      title: "Talk to a lender first",
      intro: "Before you make an offer, sellers expect to see a pre-approval letter from a lender, or proof of funds if you're paying cash. It also keeps your search focused on homes in your range.",
      blocks: [
        { h: "Pre-qualified vs. pre-approved", p: "Pre-qualified means a loan officer has looked at the basics you shared. Pre-approved goes further: the lender has checked your credit, income, assets and job and put it in a letter. A pre-approval still isn't a final loan. It depends on things like the appraisal." },
        { h: "What sets your budget", list: ["Your down payment", "The monthly payment you're comfortable with", "Your income, job history, credit and current debts", "Your closing costs"] },
        { h: "Get it in writing", p: "After you apply, your lender gives you a Loan Estimate showing your loan terms and estimated closing costs. Ask your lender about down payment options and mortgage insurance for your situation." },
        { h: "Paying cash?", p: "You'll show a proof of funds with your offer, usually a recent bank or brokerage statement." },
      ],
    },
    {
      kicker: "Step 3",
      title: "Sit down with us",
      intro: "In a buyer consultation we learn what you want, explain the process, and set up your search. As your agent, we represent you and owe you loyalty, obedience, disclosure, confidentiality and accounting.",
      blocks: [
        { h: "Your buyer agreement", p: "In Connecticut, working with a buyer's agent takes a written agreement signed by you and the brokerage, with a start date, an end date and how the agent is paid. Read it, ask us anything, and talk to an attorney if you'd like." },
        { h: "Who represents whom", list: [
          "Buyer's agent: works only for you.",
          "Seller's agent: works only for the seller, but must still share known material defects.",
          "Dual agency: if you like a home our brokerage also lists, one firm can represent both sides only if you and the seller both sign a Dual Agency Consent Agreement. You can say no.",
        ] },
        { h: "Your secrets stay yours", p: "We never tell a seller you'd pay more than your offer." },
      ],
    },
    {
      kicker: "Step 4",
      title: "Start your search",
      intro: "We set you up with a free home search from the MLS that emails you new listings that fit your criteria, so you see homes as soon as they hit the market.",
      blocks: [
        { h: "Three kinds of listings", list: [
          "Traditional sale: the owner is selling.",
          "New construction: a builder is selling.",
          "Bank-owned (REO): a lender took the home back through foreclosure and sets the price. These usually sell as-is.",
        ] },
        { h: "What you may run into", list: ["Few homes for sale in some towns", "Homes sold as-is", "Strict lender requirements", "Appraisals that come in tight", "Multiple offers on the same home"] },
        { h: "Make two lists", p: "Must-haves (towns, bedrooms, commute) and nice-to-haves. It makes decisions faster when the right home shows up." },
      ],
    },
    {
      kicker: "Step 5",
      title: "Make an offer",
      intro: "We pull recent sales of similar homes nearby and walk you through what could affect price. Then we write and negotiate your offer.",
      blocks: [
        { h: "Once it's accepted", p: "When you and the seller sign, the contract is binding on both of you, so read every page. We're here for questions, and your attorney reviews it with you." },
        { h: "Your good-faith deposit", p: "You'll put down a deposit, also called earnest money. It's held in escrow and goes toward your down payment or closing costs at closing. The amount is negotiable, and we'll talk through it before you offer." },
      ],
    },
    {
      kicker: "Step 6",
      title: "Home inspection",
      intro: "Inspections and repairs are where many deals hit bumps. Your contract gives you a set number of days to inspect, so we schedule fast.",
      blocks: [
        { h: "Hire a pro", p: "We strongly suggest a licensed home inspector. Depending on the home, you may add tests like radon, well water, septic or pests. Bank-owned and short-sale homes usually sell as-is." },
        { h: "The seller can", list: ["Refuse repairs", "Agree to all repairs", "Agree to some repairs", "Offer a credit at closing instead"] },
        { h: "Then you can", list: ["Accept their answer and keep going", "Keep negotiating", "Cancel by your contract's inspection deadline, under its terms"] },
        { h: "Watch the clock", p: "These deadlines protect your deposit. We track every one and your attorney confirms the details." },
      ],
    },
    {
      kicker: "Step 7",
      title: "Behind the scenes",
      intro: "While inspections wrap up, three things happen at once.",
      blocks: [
        { h: "Your lender", p: "Orders the appraisal and sends your file to underwriting. Send any documents they ask for right away. It's the best way to stay on schedule." },
        { h: "Your attorney", p: "Runs the title search to make sure the seller can hand you clear title. Your lender will require a lender's title insurance policy. An owner's policy is optional and protects your own stake in the home, so ask your attorney about it." },
        { h: "The Criterion team", p: "Keeps everyone on track for your closing date and keeps you posted the whole way." },
      ],
    },
    {
      kicker: "Step 8",
      title: "Your attorney and closing",
      intro: "Connecticut requires a licensed Connecticut attorney to conduct a real estate closing. Most buyers hire their own attorney early, right when the offer is accepted.",
      blocks: [
        { h: "What your attorney does", list: [
          "Reviews your contract and its deadlines",
          "Runs the title search and arranges title insurance",
          "Reviews your loan documents",
          "Prepares the closing figures with the seller's attorney and the lender",
          "Runs the closing and records your deed",
        ] },
        { h: "Your final numbers", p: "Your lender sends a Closing Disclosure before closing. Go over it with your attorney and with us. It shows your loan terms and the cash you need to bring." },
        { h: "Bringing funds", p: "You'll bring a certified or cashier's check or send a wire. Always confirm wiring instructions by calling your attorney's office at a number you already know. Never trust wiring instructions that arrive only by email." },
        { h: "It's official", p: "After closing, your attorney records your deed with the town clerk in the town where the home is. In Connecticut, land records are kept by each town, not the county." },
      ],
    },
    {
      kicker: "Step 9",
      title: "Final weeks and moving day",
      intro: "A couple of weeks before closing, check these off. Tap to mark them done.",
      checklist: [
        { id: "c1", group: "Before closing", t: "Have your down payment and closing funds ready" },
        { id: "c2", group: "Before closing", t: "Send your homeowners insurance details to your lender" },
        { id: "c3", group: "Before closing", t: "Schedule utilities: electric, gas, water, internet, trash" },
        { id: "c4", group: "Before closing", t: "Book movers or a truck" },
        { id: "c5", group: "Before closing", t: "Forward your mail with USPS" },
        { id: "c6", group: "Update your address", t: "Driver's license and vehicle registration" },
        { id: "c7", group: "Update your address", t: "Banks, credit cards, loans and investments" },
        { id: "c8", group: "Update your address", t: "Employer, insurance, doctors and schools" },
        { id: "c9", group: "Update your address", t: "IRS, Social Security and voter registration" },
        { id: "c10", group: "Update your address", t: "Subscriptions and automatic payments" },
        { id: "c11", group: "Packing", t: "Purge what you won't move" },
        { id: "c12", group: "Packing", t: "Pack rarely used items early" },
        { id: "c13", group: "Packing", t: "Keep important papers in one box: passports, birth certificates, insurance and tax papers" },
        { id: "c14", group: "Packing", t: "Pack a first-night bag" },
        { id: "c15", group: "Moving day", t: "Final walk-through of the new home" },
        { id: "c16", group: "Moving day", t: "Leave keys, garage openers and manuals for the next people" },
        { id: "c17", group: "Moving day", t: "Lock all doors and windows on your way out" },
      ],
      outro: "That's the whole path. When you're ready to start, call or text the Criterion team at (475) 897-5114.",
    },
  ],

  quiz: {
    title: "Buyer readiness quiz",
    sub: "8 quick questions. No wrong answers.",
    questions: [
      { q: "Have you talked with a lender yet?", a: ["Yes, I'm pre-approved", "I've talked to one, not pre-approved yet", "Not yet"],
        tip: "Talk to a lender about getting pre-approved. It shows you your range and makes your offers stronger." },
      { q: "When did you last check your credit?", a: ["In the last few months", "It's been a while", "Not sure"],
        tip: "Pull your free credit reports and ask a lender what they'd look for in yours." },
      { q: "Have you started saving for a down payment and closing costs?", a: ["Yes, money is set aside", "I'm working on it", "Not yet"],
        tip: "Ask a lender which down payment options fit you, and whether any assistance programs might apply." },
      { q: "Do you know the monthly payment you're comfortable with?", a: ["Yes, I have a number", "A rough idea", "Not yet"],
        tip: "Pick a monthly payment that feels comfortable, then ask your lender to work backward from it." },
      { q: "Could you pull together pay stubs, tax returns and bank statements quickly?", a: ["Yes, they're in one place", "Some of them", "Not sure what I'd need"],
        tip: "Start a folder with recent pay stubs, W-2s or tax returns, and bank statements. Ask your lender for their exact list." },
      { q: "Do you know your timing, like when your lease ends or when you need to move?", a: ["Yes, I know my date", "Roughly", "Not sure yet"],
        tip: "Check your lease end date and notice rules, then map backward. We can help you line up the timing." },
      { q: "Do you know your must-haves: towns, size, commute?", a: ["Yes, I have a clear list", "Some ideas", "Not yet"],
        tip: "Write down your must-haves and nice-to-haves. We'll turn them into a home search that emails you new listings." },
      { q: "Do you know the up-front costs, like the deposit, inspection and appraisal?", a: ["Yes, I've budgeted for them", "I've heard of them", "This is new to me"],
        tip: "Fill out the up-front cost worksheet below with quotes you collect, so nothing catches you off guard." },
    ],
    bands: [
      { min: 12, name: "Nearly ready", body: "You've done a lot of the groundwork. A few final steps and you could be ready to tour homes with an offer-ready plan." },
      { min: 6, name: "On your way", body: "You have a good start. Knock out the steps below and you'll be in a strong spot." },
      { min: 0, name: "Getting started", body: "Everyone starts here. The steps below are the fastest way to get ready, and we're happy to walk you through them." },
    ],
    resultTitle: "Your readiness score",
    nextTitle: "Your next steps",
    allSet: "You're in great shape. Next step: book a buyer consultation with the Criterion team.",
    always: "Book a free buyer consultation with the Criterion team",
    retake: "Retake quiz",
    seeResult: "See my score",
  },

  worksheet: {
    title: "Up-front cost worksheet",
    sub: "Type in your own numbers from quotes, your Loan Estimate or your lender. We total them for you.",
    sections: [
      { h: "Before closing", note: "Paid out of pocket while you're under contract.", items: [
        { id: "deposit", label: "Good-faith deposit (earnest money)", hint: "Negotiated in your offer. Credited back to you at closing." },
        { id: "inspection", label: "Home inspection", hint: "Get a quote from your inspector." },
        { id: "extra_insp", label: "Other inspections", hint: "For example radon, well water, septic or pests." },
        { id: "appraisal", label: "Appraisal fee", hint: "Ask your lender." },
        { id: "app_fee", label: "Loan application or credit report fees", hint: "Ask your lender. Some don't charge these." },
      ] },
      { h: "At closing", note: "From your Loan Estimate and your attorney.", items: [
        { id: "down", label: "Down payment", hint: "From your Loan Estimate." },
        { id: "closing", label: "Closing costs", hint: "From your Loan Estimate, then your Closing Disclosure." },
        { id: "attorney", label: "Your attorney's fee", hint: "Ask your attorney for a quote. Leave it blank if it's already in your closing costs." },
      ] },
      { h: "Moving in", note: "", items: [
        { id: "movers", label: "Movers or truck", hint: "Get a quote." },
        { id: "other", label: "Anything else", hint: "Utility deposits, small repairs, furniture." },
      ] },
    ],
    placeholder: "Enter amount",
    totalLabel: "Cash you need in total",
    depositNote: "Your deposit is credited toward your down payment and closing costs, so the total counts it only once.",
    disclaimer: "Your numbers are saved on this phone and in your personal link. This isn't a loan estimate. Your lender and attorney give you the real figures.",
  },

  footer: {
    eho: "Equal Housing Opportunity",
    legal: "Criterion Real Estate LLC, licensed in CT & NY",
    contact: "The Criterion team · (475) 897-5114",
  },
};
