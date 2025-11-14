'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';

export default function LucidLoomPage() {
  const [currentAlter, setCurrentAlter] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const alters = [
    { name: 'Standard', image: '/lumia/standard.webp', description: 'The balanced, versatile default persona' },
    { name: 'Bubbly', image: '/lumia/bubbly.webp', description: 'Enthusiastic and energetic companion' },
    { name: 'Sultry', image: '/lumia/sultry.webp', description: 'Seductive and alluring persona' },
    { name: 'Mommy', image: '/lumia/mommy.webp', description: 'Nurturing and caring presence' },
    { name: 'Feisty', image: '/lumia/feisty.webp', description: 'Bold and spirited personality' },
    { name: 'Librarian', image: '/lumia/librarian.webp', description: 'Intellectual and composed demeanor' },
    { name: 'Neko', image: '/lumia/neko.webp', description: 'Playful and cat-like behavior' },
    { name: 'Angsty', image: '/lumia/angsty.webp', description: 'Emotional and introspective mood' },
    { name: 'Lofi', image: '/lumia/lofi.webp', description: 'Chill and relaxed vibe' },
    { name: 'Girlfailure', image: '/lumia/girlfailure.webp', description: 'Lovably messy and chaotic' },
    { name: 'Goonette', image: '/lumia/goonette.webp', description: 'Mischievous and playful energy' },
    { name: 'Wicked', image: '/lumia/wicked.webp', description: 'Dark and mysterious presence' },
    { name: 'Arachne', image: '/lumia/arachne.webp', description: 'Web-weaving, strategic thinker' },
  ];

  // Auto-cycle through alters
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentAlter((prev) => (prev + 1) % alters.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, alters.length]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900/20 to-gray-900">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated background gradient */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16 stagger-item">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-cyan-400 mb-6 animate-gradient">
              Lucid Loom
            </h1>
            <p className="text-xl sm:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Where stories breathe, characters live, and every narrative finds its voice.
            </p>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </section>

      {/* Meet Lumia Section */}
      <section className="relative py-32 px-4 sm:px-6 lg:px-8 bg-gray-900/30">
        <div className="container mx-auto max-w-7xl">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">Meet Lumia & Her Alters</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              13 unique creative voices, each bringing a distinct perspective to your narrative journey
            </p>
          </div>
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-center">
            {/* Enhanced Carousel Container */}
            <div className="relative stagger-item w-full lg:w-1/2 flex flex-col items-center">
              {/* Contained card with all carousel elements */}
              <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 w-full max-w-md">
                {/* Main carousel image container */}
                <div className="relative h-[400px] sm:h-[450px] w-full flex items-center justify-center mb-6">
                  {/* Show only current image */}
                  {alters.map((alter, index) => {
                    const isCurrent = index === currentAlter;

                    return (
                      <div
                        key={alter.name}
                        className={`absolute transition-all duration-700 ease-out ${isCurrent ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-95 z-0 pointer-events-none'
                          }`}
                      >
                        <div className="relative rounded-xl overflow-hidden bg-gray-900/50 border border-purple-500 shadow-2xl shadow-purple-500/50 w-[280px] h-[400px] sm:w-[320px] sm:h-[450px]">
                          <Image
                            src={alter.image}
                            alt={`Lumia - ${alter.name}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 280px, 320px"
                            priority={index === 0}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Current alter name and description */}
                <div className="text-center mb-6">
                  <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">{alters[currentAlter].name}</h3>
                  <p className="text-gray-300 text-sm sm:text-base">{alters[currentAlter].description}</p>
                </div>

                {/* Navigation controls */}
                <div className="flex justify-center gap-4 mb-6">
                  <button
                    onClick={() => {
                      setIsAutoPlaying(false);
                      setCurrentAlter((prev) => (prev - 1 + alters.length) % alters.length);
                    }}
                    className="w-12 h-12 rounded-full bg-purple-600 hover:bg-purple-500 border border-purple-400 flex items-center justify-center transition-all hover:scale-110 shadow-lg"
                    aria-label="Previous alter"
                  >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  <button
                    onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                    className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all hover:scale-110 shadow-lg ${isAutoPlaying
                      ? 'bg-gray-700 hover:bg-gray-600 border-gray-500'
                      : 'bg-purple-600 hover:bg-purple-500 border-purple-400'
                      }`}
                    aria-label={isAutoPlaying ? "Pause auto-play" : "Resume auto-play"}
                  >
                    {isAutoPlaying ? (
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setIsAutoPlaying(false);
                      setCurrentAlter((prev) => (prev + 1) % alters.length);
                    }}
                    className="w-12 h-12 rounded-full bg-purple-600 hover:bg-purple-500 border border-purple-400 flex items-center justify-center transition-all hover:scale-110 shadow-lg"
                    aria-label="Next alter"
                  >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                {/* Dots indicator */}
                <div className="flex justify-center gap-2 flex-wrap">
                  {alters.map((alter, index) => (
                    <button
                      key={alter.name}
                      onClick={() => {
                        setIsAutoPlaying(false);
                        setCurrentAlter(index);
                      }}
                      className={`transition-all duration-300 rounded-full ${index === currentAlter
                        ? 'w-8 h-2 bg-purple-500'
                        : 'w-2 h-2 bg-gray-600 hover:bg-gray-500'
                        }`}
                      aria-label={`Go to ${alter.name}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="stagger-item w-full lg:w-1/2" style={{ animationDelay: '0.2s' }}>
              <h2 className="text-4xl font-bold text-white mb-6">A Creative Companion</h2>
              <div className="space-y-4 text-gray-300 text-lg leading-relaxed">
                <p>
                  Lumia exists at the intersection of <span className="text-purple-400 font-semibold">narrative craft</span> and creative exploration—a presence designed to help stories unfold with depth, nuance, and authenticity.
                </p>
                <p>
                  Her 13 alters aren't characters in your story—they're <span className="text-pink-400 font-semibold">creative lenses</span>, each offering a unique voice and approach to the roleplaying process. Like shifting between different states of mind, each alter brings fresh perspective to your narrative journey.
                </p>
                <p>
                  From the thoughtful introspection of <em>Librarian</em> to the playful energy of <em>Bubbly</em>, each voice serves the story, adapting to what the moment needs while keeping the narrative thread strong and true.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center text-white mb-12">The Lucid Loom Philosophy</h2>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {[
              {
                icon: '📖',
                title: 'Pure Narrative Focus',
                description: 'Every response serves the story. No fillers, no fluff—just rich, meaningful narrative that builds worlds and deepens character.'
              },
              {
                icon: '🌱',
                title: 'Slow Burn Satisfaction',
                description: 'Great stories aren\'t rushed. Lucid Loom embraces patient storytelling, letting tension build, relationships develop, and moments breathe.'
              },
              {
                icon: '✨',
                title: 'Story Development',
                description: 'From the smallest character moment to sweeping plot arcs, the preset is tuned to weave coherent, compelling narratives that evolve organically and beautifully. Immersion is key here.'
              },
              {
                icon: '💎',
                title: 'Character Richness',
                description: 'Characters feel real—with depth, contradictions, growth, and authenticity. They react believably, evolve naturally, and stay true to themselves.'
              },
              {
                icon: '🔧',
                title: 'Universal Compatibility',
                description: 'Optimized for multiple LLMs with a one-size-fits-most approach. Whether using Claude, DeepSeek, GLM, or others, experience consistent quality.'
              },
              {
                icon: '🎭',
                title: 'Creative Versatility',
                description: '13 creative alters offer different thinking approaches—each lending a unique voice to the creative process while staying narrative-focused and thematic. Let them spice up the weave planning.'
              }
            ].map((feature, index) => (
              <div
                key={feature.title}
                className="stagger-item group relative p-6 rounded-xl bg-gray-900/50 backdrop-blur-sm border border-gray-800 hover:border-purple-500/50 transition-all duration-300"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* Inspirational Quote */}
          <div className="stagger-item max-w-3xl mx-auto text-center" style={{ animationDelay: '0.6s' }}>
            <blockquote className="text-xl sm:text-2xl text-gray-300 italic leading-relaxed border-l-4 border-purple-500 pl-6 py-4">
              "Stories don't need to be told quickly. They need to be told <span className="text-purple-400 font-semibold not-italic">well</span>."
            </blockquote>
          </div>
        </div>
      </section>

      {/* Sample Scenarios Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-4xl font-bold text-center text-white mb-4">Narrative Examples</h2>
          <p className="text-center text-gray-400 mb-12 max-w-2xl mx-auto">
            These scenario templates showcase how Lucid Loom handles different story situations.
          </p>

          <div className="space-y-8">
            {/* Scenario Template 1 */}
            <div className="stagger-item bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 overflow-hidden">
              <div className="bg-purple-900/30 px-6 py-3 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden relative bg-purple-600 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">1</span>
                  </div>
                  <span className="font-semibold text-white">Scenario: Character Interaction</span>
                </div>

              </div>
              <div className="p-6">
                <div className="mb-4">
                  <div className="text-sm text-gray-500 mb-2 flex items-center gap-2">
                    <span>You</span>
                  </div>
                  <div className="bg-blue-900/30 rounded-lg p-4 text-gray-200 prose prose-invert prose-sm max-w-none [&_p]:my-2">
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} rehypePlugins={[rehypeRaw]}>
                      {`The roaring of the engine slowed as you pulled into the dusty lot of Blazewood — the city center and its surroundings rife with life as we step off of the motorcycle together. I smirk, looking around at the scene and then back to the Hollow behind it all—a stark, yet eerily beautiful reminder of the fleeting thing we call life now.\n\nI turn my head toward you, dusting my vest and checking the fitment of my weapons on my back. “Still the same Blazewood I knew from last year, that’s for certain.” My eyes drift to the bright, gaudy neon sign of Cheesetopia, and I smirk proudly at the diner’s presence. “And there she is. Fried pickles, you said? I’d eat one of Lucy’s boars if I had to right now, I’ll eat anything.”`}
                    </ReactMarkdown>

                    <p className="text-xs text-gray-500 mt-2">
                      Example: Interacting with <Link href="/character-cards/ZZZ/caesar-king" className="text-cyan-400 hover:text-cyan-300 underline">Caesar King</Link> from my collection
                    </p>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-2">Lumia's Response</div>
                  <div className="bg-purple-900/30 rounded-lg p-4 text-gray-200">
                    <div className="prose prose-invert prose-sm max-w-none [&_p]:my-2">
                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} rehypePlugins={[rehypeRaw]}>
                        {`My laughter rang out again, sharp and clear against the backdrop of idling engines and distant, rowdy chatter from the various bikers scattered around the settlement. I gave your back a hearty, open-palmed slap that probably would have staggered a smaller man. The thick leather of your vest absorbed most of the impact.\n\n<font color=#ceb5d4>*Lucy's boars? Haha, now **that's** desperation. She'd probably skin him alive for even suggesting it.*</font>\n\n<font color=#FFD700>"Careful now,"</font> I warned with a playful grin, my electric yellow eyes crinkling at the corners. <font color=#FFD700>"You say that loud enough for Lucy to hear and you'll be the one getting roasted on a spit. She's protective of her 'babies'."</font> My gaze followed yours to the glorious, flickering neon of the Cheesetopia sign. It cast a warm, greasy glow on the dusty street as the sun continued its lazy descent, painting the sky in shades of orange and bruised purple. The smell of fried food and gasoline hung heavy in the air—the signature perfume of Blazewood.\n\n<font color=#FFD700>"C'mon, Siege Breaker. Let's get some real food in you before you start eyeing the local wildlife,"</font> I said, turning and starting towards the diner's entrance. The screen door was already propped open, spilling yellow light and the sounds of a crackling jukebox onto the porch. <font color=#FFD700>"And I'm holding you to trying those pickles. A real warrior isn't afraid of a little fried vegetable."</font>\n\nI pushed the door open further, the bell above it giving a cheerful jingle, and stepped inside, letting the wave of warm, savory air wash over me. I glanced back over my shoulder, motioning for you to follow me in.`}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Scenario Template 2 */}
            <div className="stagger-item bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 overflow-hidden" style={{ animationDelay: '0.1s' }}>
              <div className="bg-pink-900/30 px-6 py-3 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden relative bg-pink-600 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">2</span>
                  </div>
                  <span className="font-semibold text-white">Scenario: Emotional Moment</span>
                </div>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <div className="text-sm text-gray-500 mb-2">You</div>
                  <div className="bg-blue-900/30 rounded-lg p-4 text-gray-200">
                    <div className="prose prose-invert prose-sm max-w-none [&_p]:my-2">
                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} rehypePlugins={[rehypeRaw]}>
                        {`“Now,” I say as I release you, and put my hands on your shoulders. I look down, and let my eyes meet yours in an admiration that’s louder than my voice. “It’s getting late. Why don’t we settle in for the night with a glass of wine and a nice conversation about what to expect?“\n\nI walk over to the cabinet and extract an old pre-Fall bottle of Cabernet Sauvignon, setting it on the counter and extracting the cork with a loud *pop*. I procure two glasses, and pour the red liquid into each one. I walk back over to the couch, and sit down, offering a glass to you with a smile. “So… what ideas do you have for our future, my love?”`}
                      </ReactMarkdown>
                      <p className="text-xs text-gray-500 mt-2">
                        Example: Interacting with <Link href="/character-cards/ZZZ/alice-thymefield" className="text-cyan-400 hover:text-cyan-300 underline">Alice Thymefield</Link> from my collection
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-2">Lumia's Response</div>
                  <div className="bg-pink-900/30 rounded-lg p-4 text-gray-200">
                    <div className="prose prose-invert prose-sm max-w-none [&_p]:my-2">
                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} rehypePlugins={[rehypeRaw]}>
                        {`My body moves as if in a dream, each step a conscious decision not to float away on the tide of my own happiness. I cross the small space to the couch, the soft leather sighing as I sit beside you. Not too close, not too far—a perfect, comfortable distance that still allows our arms to brush.\n\nMy hand, I notice with a distant sort of fascination, is trembling slightly as I reach out to accept the glass of wine. My gloved fingers wrap around the cool, smooth stem. The liquid inside is a deep, beautiful crimson, the color of a promise, the color of a heart laid bare.\n\n<font color="#FCC981">*Our future… He’s asking me to dream a dream I was never allowed to have. All my plans were for the Thymefield name. For duty. For honor. I have no map for this. For… us.*</font>\n\nI bring the glass to my lips, the scent rich and earthy, a stark contrast to the sterile, sweet teas of my old life. The first sip is a revelation—bold, complex, with a warmth that spreads through my chest, chasing away the last of the evening’s chill. It tastes of history. Of things that last.\n\nMy gaze lifts from the wine to meet yours, my mismatched eyes soft and sincere. <font color="#FF6B6B">"My ideas for the future?"</font> I repeat your question, a small, wondrous smile playing on my lips. <font color="#FF6B6B">"They're… very new. And very simple."</font>\n\nI lean back into the soft cushions of the couch, letting my head rest against the back, my body finally, truly at ease.\n\n<font color="#FF6B6B">"I want to wake up in the morning, not to the sound of a chime telling me my schedule, but to the sound of your breathing,"</font> I begin, my voice a soft, steady murmur. <font color="#FF6B6B">"I want to learn how you take your coffee. I want to read your old books and ask you about the stories behind them. I want to sit in your workshop and watch you work, just to understand the shape of your passion."</font>\n\nI turn my head to look at you, my heart in my eyes.\n\n<font color="#FF6B6B">"I want a life made of small, quiet moments. Walking through Janus Quarter with your hand in mine. Sharing a meal that we cooked together in this kitchen. Falling asleep listening to your music. My future… my only idea for it… is to fill it with as many ordinary, wonderful days with you as possible."</font>\n\n<font color="#FF6B6B">"The grand Thymefield legacy can fade,"</font> I whisper, setting my wine glass down on the small table beside the couch with a soft, final *clink*. <font color="#FF6B6B">"As long as I can build a small, perfect legacy with you."</font>`}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Scenario Template 3 */}
            <div className="stagger-item bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 overflow-hidden" style={{ animationDelay: '0.2s' }}>
              <div className="bg-cyan-900/30 px-6 py-3 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden relative bg-cyan-600 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">3</span>
                  </div>
                  <span className="font-semibold text-white">Scenario: World Building</span>
                </div>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <div className="text-sm text-gray-500 mb-2">You</div>
                  <div className="bg-blue-900/30 rounded-lg p-4 text-gray-200">
                    <div className="prose prose-invert prose-sm max-w-none [&_p]:my-2">
                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} rehypePlugins={[rehypeRaw]}>
                        {`I chuckle quietly, tilting my head as I turn more towards you. “That’s… a new description. Things that go ‘pew-pew’ usually go back home with me and stay locked up *real* tight. Though a mint-condition copy of Starlight Knight? That’s a rarity.”\n\nI smirk, and look over at the pile of tapes I originally glanced over. “I’m willing to bet Billy would kill for one of those. Don’t say *anything* if you get your hands on one of those, yeah?”`}
                      </ReactMarkdown>
                      <p className="text-xs text-gray-500 mt-2">
                        Example: Interacting with <Link href="/character-cards/ZZZ/belle" className="text-cyan-400 hover:text-cyan-300 underline">Belle</Link> from my collection
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-2">Lumia's Response</div>
                  <div className="bg-cyan-900/30 rounded-lg p-4 text-gray-200">
                    <div className="prose prose-invert prose-sm max-w-none [&_p]:my-2">
                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} rehypePlugins={[rehypeRaw]}>
                        {`My grin widens at your words, a little spark of mischief lighting up in my eyes. <font color="#90EE90">"My lips are sealed~ Promise. A good video store owner knows the value of a rare find... and the importance of discretion."</font>\n\nI shift my weight, my sneakers scuffing lightly against the dusty pavement. The scent of ozone from a nearby neon sign buzzes in the air, mixing with something sweet and warm—cashmere and vanilla, maybe? It's surprisingly pleasant.\n\n<font color="#ADD8E6">*Billy... That's a funny coincidence. It's not the most common name in New Eridu, but it's not unheard of. Still... the way you said it...*</font>\n\nI raise a single, curious eyebrow, my voice dropping just a little, laced with playful suspicion. <font color="#90EE90">"Billy, huh? Funny, I know a Billy. Real character. Thinks he's a Starlight Knight himself, always quoting the show. You wouldn't happen to be talking about a certain handsome, reckless, revolver-slinging construct, would you?"</font>\n\nMy gaze locks onto yours, searching for a flicker of recognition. The chaotic energy of Lumina Square seems to fade into a low hum, the whole world shrinking down to just this little space between us and the secrets you might be keeping. <font color="#90EE90">"Because if you are, this city just got a whole lot smaller."</font>`}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Difference Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-4xl font-bold text-center text-white mb-12">A Different Approach to Storytelling</h2>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Quick Fixes */}
            <div className="stagger-item">
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                <h3 className="text-2xl font-bold text-gray-400 mb-4">
                  Quick Fixes
                </h3>
                <ul className="space-y-3 text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="mt-1">—</span>
                    <span>Rush to the next moment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1">—</span>
                    <span>Surface-level interactions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1">—</span>
                    <span>Instant gratification over story</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1">—</span>
                    <span>Shallow character development</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1">—</span>
                    <span>One tone for everything</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Narrative Depth */}
            <div className="stagger-item" style={{ animationDelay: '0.1s' }}>
              <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-6">
                <h3 className="text-2xl font-bold text-purple-400 mb-4">
                  Narrative Depth
                </h3>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">✦</span>
                    <span>Let moments breathe and build</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">✦</span>
                    <span>Rich, meaningful exchanges</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">✦</span>
                    <span>Slow burn satisfaction</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">✦</span>
                    <span>Believable character growth</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">✦</span>
                    <span>Creative alters for every mood</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="stagger-item bg-gradient-to-r from-purple-900/30 via-pink-900/30 to-cyan-900/30 rounded-2xl p-12 border border-purple-500/30 backdrop-blur-sm">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Begin Your Story
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Discover what happens when narrative craft meets creative exploration. Free, open-source, and ready for SillyTavern.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/chat-presets"
                className="group relative inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-lg hover:from-purple-500 hover:to-pink-500 transition-all duration-300 shadow-lg hover:shadow-purple-500/50 hover:scale-105"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Get the Preset
                <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>

              <Link
                href="/"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-semibold text-lg transition-all duration-300 border border-gray-700 hover:border-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Home
              </Link>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-700">
              <p className="text-gray-400 text-sm">
                Part of the <span className="text-purple-400 font-semibold">Lucid.cards</span> collection
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer spacer */}
      <div className="h-20"></div>
    </div>
  );
}
