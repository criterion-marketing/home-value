/* All page copy lives here. content.md is generated from this file (node ../tools/make-content-md.cjs). */
window.CONTENT = {
  hero: {
    generic: { kicker: "Criterion buyer guide", title: "Your path home.", line: "Six simple stops from pre-approval to keys, in Connecticut." },
    renter: { kicker: "Renting now?", title: "From renting to keys.", line: "See what it takes to buy, one simple stop at a time." },
    img: { alt: "A white colonial farmhouse in the Connecticut countryside at golden hour" },
    cta: "Start the journey",
    ctaQuiz: "Am I ready? Take the quiz",
  },

  journey: {
    kicker: "The journey",
    title: "Six stops to your keys.",
    line: "Tap any stop to jump there.",
  },

  // Each stop: headline 3-6 words, line under ~25 words, detail behind "More".
  stops: [
    {
      id: "preapproval", label: "Pre-approval", img: "preapproval", alt: "A purchase agreement, a pen and reading glasses on an oak desk",
      title: "Get pre-approved first.",
      line: "A lender checks your credit, income and savings, then puts your budget in writing. Sellers expect to see it.",
      more: [
        { h: "Pre-qualified vs. pre-approved", p: "Pre-qualified is a quick look at what you share. Pre-approved means the lender checked your credit, income and assets. It still isn't a final loan." },
        { h: "Get it in writing", p: "After you apply, your lender gives you a Loan Estimate with your loan terms and estimated closing costs." },
        { h: "Paying cash?", p: "You'll show proof of funds with your offer, like a recent bank statement." },
      ],
    },
    {
      id: "search", label: "Search", img: "search", alt: "A bright living room with tall windows",
      title: "Search with us.",
      line: "Sign a simple buyer agreement, share your must-haves, and see new listings as soon as they hit the market.",
      more: [
        { h: "Your buyer agreement", p: "In Connecticut, working with a buyer's agent takes a written, signed agreement with a start date, an end date and how the agent is paid." },
        { h: "Who represents whom", p: "We represent you. If you like a home our brokerage also lists, we can represent both sides only if you and the seller sign a Dual Agency Consent Agreement. You can say no." },
        { h: "Make two lists", p: "Must-haves and nice-to-haves: towns, size, commute. Decisions get faster when the right home shows up." },
      ],
    },
    {
      id: "offer", label: "Offer", img: "offer", alt: "A pen resting on a purchase agreement at the signature lines",
      title: "Make your offer.",
      line: "We look at recent nearby sales, write a strong offer and negotiate for you.",
      more: [
        { h: "Your good-faith deposit", p: "You put down a deposit, also called earnest money. It's held in escrow and credited toward your costs at closing. The amount is negotiable." },
        { h: "Once it's signed", p: "The contract binds you and the seller, so read every page. Your attorney reviews it with you." },
      ],
    },
    {
      id: "inspection", label: "Inspection", img: "inspection", alt: "An inspection checklist on a clipboard by an old windowsill",
      title: "Inspect before you commit.",
      line: "A licensed home inspector checks the house. Then you can ask for repairs or a credit.",
      more: [
        { h: "Extra tests", p: "Depending on the home, you may add radon, well water, septic or pest tests." },
        { h: "What happens next", p: "The seller can agree, say no, or offer a credit. You can accept, keep negotiating, or cancel by your contract's deadline, under its terms." },
        { h: "Watch the clock", p: "Inspection deadlines are set in your contract. We track every one." },
      ],
    },
    {
      id: "closing", label: "Attorney & closing", img: "closing", alt: "Closing documents set out on a conference table",
      title: "Your attorney closes it.",
      line: "In Connecticut, a licensed attorney runs your closing. You review your final numbers before you sign.",
      more: [
        { h: "Behind the scenes", p: "Your lender orders the appraisal and finishes underwriting. Your attorney runs the title search." },
        { h: "Title insurance", p: "Your lender requires a lender's title policy. An owner's policy is optional and protects you. Ask your attorney about it." },
        { h: "Your final numbers", p: "Your lender sends a Closing Disclosure before closing. Review it with your attorney and with us." },
        { h: "Wiring money", p: "Always confirm wiring instructions by calling your attorney's office at a number you already know. Never trust instructions that arrive only by email." },
      ],
    },
    {
      id: "keys", label: "Keys", img: "keys", alt: "A modern house key on a marble kitchen island",
      title: "Keys in hand.",
      line: "Your attorney records your deed with the town clerk. Then it's moving day.",
      moreLabel: "Moving checklist",
      note: "In Connecticut, land records are kept by each town, not the county.",
      checklist: [
        { id: "c1", t: "Down payment and closing funds ready" },
        { id: "c2", t: "Homeowners insurance details sent to your lender" },
        { id: "c3", t: "Utilities scheduled" },
        { id: "c4", t: "Movers or truck booked" },
        { id: "c5", t: "Mail forwarded with USPS" },
        { id: "c6", t: "Address updated: license, banks, employer" },
        { id: "c7", t: "Important papers packed in one box" },
        { id: "c8", t: "First-night bag packed" },
        { id: "c9", t: "Final walk-through done" },
      ],
    },
  ],
  more: "More",
  less: "Less",

  quiz: {
    kicker: "1-minute quiz",
    title: "Are you ready to buy?",
    line: "Eight quick taps. No wrong answers.",
    answers: ["Yes", "Sort of", "Not yet"],
    back: "Back",
    questions: [
      { icon: "closing", q: "Talked to a lender?", tip: "Talk to a lender about getting pre-approved." },
      { icon: "gauge", q: "Checked your credit lately?", tip: "Pull your free credit reports." },
      { icon: "coins", q: "Saving for a down payment?", tip: "Ask a lender about down payment options and programs." },
      { icon: "wallet", q: "Know your monthly budget?", tip: "Pick a monthly payment that feels comfortable." },
      { icon: "folder", q: "Paperwork in one place?", tip: "Gather pay stubs, tax returns and bank statements." },
      { icon: "calendar", q: "Know your move-by date?", tip: "Check your lease end date and plan back from it." },
      { icon: "list", q: "Know your must-haves?", tip: "List your must-haves and nice-to-haves." },
      { icon: "receipt", q: "Know your up-front costs?", tip: "Fill in the cost worksheet below." },
    ],
    bands: [
      { min: 12, name: "Nearly ready", line: "You've done most of the groundwork." },
      { min: 6, name: "On your way", line: "A good start. A few steps to go." },
      { min: 0, name: "Getting started", line: "Everyone starts here. We'll help." },
    ],
    nextTitle: "Your next 3 steps",
    always: "Book a free buyer consultation with the Criterion team.",
    allSet: "You're in great shape. Book a buyer consultation with the Criterion team.",
    moreSteps: "More steps",
    retake: "Retake",
    // Score is locked until sign-up (first name, cell, SMS consent).
    locked: {
      kicker: "Quiz complete",
      title: "Your score is ready.",
      line: "Add your first name and cell to see your score and next 3 steps. We'll text you the link too.",
      submit: "Show my score",
    },
    unlocked: { sent: "Your link is on its way by text.", tailor: "Tailor my plan" },
  },

  worksheet: {
    kicker: "Up-front costs",
    title: "Know your number.",
    line: "Type in your own figures from quotes and your Loan Estimate. We add them up.",
    placeholder: "Enter amount",
    items: [
      { id: "deposit", icon: "handshake", label: "Good-faith deposit", hint: "Set in your offer. Credited back at closing." },
      { id: "inspect", icon: "search", label: "Inspections", hint: "Home inspection plus any tests." },
      { id: "down", icon: "house", label: "Down payment", hint: "From your Loan Estimate." },
      { id: "closing", icon: "doc", label: "Closing costs", hint: "From your Loan Estimate. Add your attorney's fee if it isn't listed." },
      { id: "moving", icon: "truck", label: "Moving", hint: "Movers or a truck, utility deposits." },
    ],
    totalLabel: "Cash to have ready",
    note: "Your deposit is credited at closing, so we count it once. This isn't a loan estimate. Your lender and attorney give you the real figures.",
  },

  signup: {
    img: { name: "door", alt: "A black front door with brass lanterns at dusk" },
    kicker: "Save your plan",
    title: "Get it by text.",
    line: "We'll text you a link to your guide, quiz results and numbers.",
    fields: {
      first_name: { label: "First name", placeholder: "First name" },
      phone: { label: "Cell", placeholder: "(555) 555-0123" },
    },
    consent:
      "I agree to receive text messages from the Criterion team at Criterion Real Estate LLC at the cell number above, including my guide link and follow-up about buying a home. Messages may be sent using automated technology. Consent is not a condition of buying any property or service. Message frequency varies. Msg & data rates may apply. Reply STOP to opt out or HELP for help.",
    submit: "Text me my link",
    sending: "Sending…",
    errors: {
      first_name: "Please enter your first name.",
      phone: "Please enter a 10-digit cell number.",
      sms_consent: "Please check the box so we can text you.",
      email: "Please check your email, or leave it blank.",
    },
    extras: {
      title: "Thanks, {name}.",
      line: "Want it tailored? All optional.",
      town: { label: "Town", options: ["Danbury", "Newtown", "Brookfield", "New Fairfield", "New Milford", "Other"] },
      timeline: { label: "When", options: ["0-3 months", "3-6 months", "6-12 months", "12+ months", "Not sure"] },
      renting: { label: "Renting now?", options: ["Yes", "No"] },
      lender: { label: "Introduce me to a lender", hint: "The Criterion team makes the intro. You're never required to use any particular lender." },
      email: { label: "Email", placeholder: "you@example.com" },
      save: "Save",
      skip: "Skip",
    },
    done: {
      title: "You're all set.",
      line: "We'll text you your plan shortly. It opens right where you left off, and you can copy the link here too.",
      copy: "Copy",
      copied: "Copied",
    },
  },

  saveSpot: { label: "Save my spot", saved: "Saved. Link copied." },
  footer: { eho: "Equal Housing Opportunity", legal: "Criterion Real Estate LLC, licensed in CT & NY", team: "The Criterion team", photos: "Photos are illustrative and do not show listed properties." },
  mockbar: "Prototype: the form doesn't send anything yet.",
};
