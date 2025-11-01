'use client';

import Image from 'next/image';
import Slideshow from '../components/Slideshow';
import Ticker from '../components/Ticker';
import Noise from '../components/Noise';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/65 backdrop-blur-[10px] z-[1000] px-6 md:px-20 lg:px-32 xl:px-48">
        <nav className="flex justify-between items-center py-4 px-6 max-w-[1400px] mx-auto">
          <div className="font-semibold text-xl">Chatbase</div>
          <div className="hidden md:flex gap-14 items-center">
            <a href="#pricing" className="text-base font-semibold text-[#09090B] no-underline hover:opacity-70 transition-opacity">Pricing</a>
            <a href="#enterprise" className="text-base font-semibold text-[#09090B] no-underline hover:opacity-70 transition-opacity">Enterprise</a>
            <a href="#resources" className="text-base font-semibold text-[#09090B] no-underline hover:opacity-70 transition-opacity">Resources</a>
          </div>
          <div className="flex gap-4 items-center">
            <a href="#signin" className="text-base font-semibold text-[#09090B] no-underline hidden md:inline hover:opacity-70 transition-opacity">Sign in</a>
            <a href="#try" className="bg-[#09090B] text-[#FAFAFA] px-5 py-2.5 rounded-lg text-base font-semibold no-underline shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] hover:bg-[#27272A] transition-colors">
              Try for Free
            </a>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="bg-white px-6 md:px-20 lg:px-32 xl:px-48 pt-[100px] pb-20 mt-[52px] relative overflow-hidden min-h-[calc(100vh-52px)] flex items-center">
        <Noise patternAlpha={10} />
        <div className="max-w-[1440px] mx-auto flex flex-col items-center gap-9 w-full relative z-10">
          <div className="w-full flex flex-col items-center gap-8">
            {/* Booking Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-[7px] bg-white rounded-full shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
              <span className="w-1.5 h-1.5 bg-[#0CB300] rounded-full"></span>
              <span className="text-[14.8px] leading-[1.84]">Booking Open — 2 Spots Left</span>
            </div>
            
            {/* Main Heading */}
            <div className="flex flex-col items-center gap-2 w-full">
              <div className="flex items-center justify-center gap-2 md:gap-4 flex-wrap md:flex-nowrap">
                <span className="text-4xl md:text-6xl xl:text-[72px] font-bold leading-[1.2] tracking-[-0.04em] whitespace-nowrap">Unlimited</span>
                <Slideshow />
                <span className="text-4xl md:text-6xl xl:text-[72px] font-bold leading-[1.2] tracking-[-0.04em] whitespace-nowrap">Design</span>
              </div>
              
              <div className="flex items-center justify-center gap-2 md:gap-4 flex-wrap md:flex-nowrap">
                <span className="text-4xl md:text-6xl xl:text-[72px] font-normal leading-[1.2] tracking-[-0.04em] whitespace-nowrap opacity-50">for</span>
                <Ticker />
                <span className="text-4xl md:text-6xl xl:text-[72px] font-bold leading-[1.2] tracking-[-0.04em] whitespace-nowrap">Solid Startups</span>
              </div>
            </div>
            
            {/* Subheading */}
            <p className="text-base leading-[1.6] tracking-[-0.01em] text-center text-black/50 max-w-[500px] mt-2">
              We help startups and brands create beautiful, functional products — fast and hassle-free.
            </p>
          </div>
          
          {/* CTA Section */}
          <div className="flex flex-col items-center gap-3">
            <div className="bg-white rounded-[33px] p-2">
              <button className="bg-[#09090B] text-white px-6 py-[11px] border-none rounded-full font-bold text-[15.1px] cursor-pointer shadow-[24px_24px_74.67px_-2.5px_rgba(0,0,0,0.18),inset_0px_-16px_48px_0px_rgba(0,0,0,1)]">
                Choose your plan
              </button>
            </div>
            
            <div className="flex flex-col items-center gap-0.5">
              <div className="flex gap-[-6px]">
                <Image src="/avatar1-7324be.png" alt="Client 1" width={31} height={31} className="w-[31px] h-[31px] rounded-full border border-white -ml-0 first:ml-0" />
                <Image src="/avatar2-7324be.png" alt="Client 2" width={31} height={31} className="w-[31px] h-[31px] rounded-full border border-white -ml-1.5" />
                <Image src="/avatar3-4171bf.png" alt="Client 3" width={31} height={31} className="w-[31px] h-[31px] rounded-full border border-white -ml-1.5" />
                <Image src="/avatar4-7324be.png" alt="Client 4" width={31} height={31} className="w-[31px] h-[31px] rounded-full border border-white -ml-1.5" />
                <Image src="/avatar5-7324be.png" alt="Client 5" width={31} height={31} className="w-[31px] h-[31px] rounded-full border border-white -ml-1.5" />
              </div>
              <p className="text-[14.8px] leading-[1.84] text-black/50">Trusted by Leaders</p>
            </div>
          </div>
        </div>
      </section>

      {/* Highlights Section */}
      <section className="bg-[#FAFAFA] px-6 md:px-20 lg:px-32 xl:px-48 py-20">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-[17px] py-[7px] border border-[#E4E4E7] rounded-full font-medium text-base mb-4 bg-white">
              Highlights
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium leading-[1.25] mb-4 px-4">
              The complete platform for AI support agents
            </h2>
            <p className="text-lg text-[#71717B] max-w-[700px] mx-auto px-4">
              Chatbase is designed for building AI support agents that solve your customers' hardest problems while improving business outcomes.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-[#E4E4E7] rounded-3xl p-6">
              <div className="w-full h-[280px] bg-gradient-to-br from-[#f093fb] to-[#f5576c] rounded-2xl mb-4"></div>
              <h3 className="text-2xl font-medium mb-2">Purpose-built for LLMs</h3>
              <p className="text-[#71717B] text-base">
                Language models with reasoning capabilities for effective responses to complex queries.
              </p>
            </div>
            <div className="bg-white border border-[#E4E4E7] rounded-3xl p-6">
              <div className="w-full h-[280px] bg-gradient-to-br from-[#4facfe] to-[#00f2fe] rounded-2xl mb-4"></div>
              <h3 className="text-2xl font-medium mb-2">Designed for simplicity</h3>
              <p className="text-[#71717B] text-base">
                Create, manage, and deploy AI Agents easily, even without technical skills.
              </p>
            </div>
            <div className="bg-white border border-[#E4E4E7] rounded-3xl p-6">
              <div className="w-full h-[280px] bg-gradient-to-br from-[#fa709a] to-[#fee140] rounded-2xl mb-4"></div>
              <h3 className="text-2xl font-medium mb-2">Engineered for security</h3>
              <p className="text-[#71717B] text-base">
                Enjoy peace of mind with robust encryption and strict compliance standards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-white px-6 md:px-20 lg:px-32 xl:px-48 py-20">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-[17px] py-[7px] border border-[#E4E4E7] rounded-full font-medium text-base mb-4 bg-white">
              How it works
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium leading-[1.25] mb-4 px-4">
              An end-to-end solution for conversational AI
            </h2>
            <p className="text-lg text-[#71717B] max-w-[700px] mx-auto px-4">
              With Chatbase, your customers can effortlessly find answers, resolve issues, and take meaningful actions through seamless and engaging AI-driven conversations.
            </p>
          </div>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 flex flex-col gap-2">
              <div className="bg-white border border-[#E4E4E7] rounded-2xl p-6 opacity-100">
                <span className="font-semibold text-sm mr-4">01.</span>
                <h3 className="text-2xl font-medium mb-2 inline">Build & deploy your agent</h3>
                <p className="text-[#71717B] text-sm mt-2">
                  Train an agent on your business data, configure the actions it can take, then deploy it for your customers.
                </p>
              </div>
              <div className="bg-white border border-[#E4E4E7] rounded-2xl p-6 opacity-60">
                <span className="font-semibold text-sm mr-4">02.</span>
                <h3 className="text-2xl font-medium inline">Agent solves your customers' problems</h3>
              </div>
              <div className="bg-white border border-[#E4E4E7] rounded-2xl p-6 opacity-60">
                <span className="font-semibold text-sm mr-4">03.</span>
                <h3 className="text-2xl font-medium inline">Refine & optimize</h3>
              </div>
              <div className="bg-white border border-[#E4E4E7] rounded-2xl p-6 opacity-60">
                <span className="font-semibold text-sm mr-4">04.</span>
                <h3 className="text-2xl font-medium inline">Route complex issues to a human</h3>
              </div>
              <div className="bg-white border border-[#E4E4E7] rounded-2xl p-6 opacity-60">
                <span className="font-semibold text-sm mr-4">05.</span>
                <h3 className="text-2xl font-medium inline">Review analytics & insights</h3>
              </div>
            </div>
            <div className="flex-1">
              <div className="w-full h-[643px] bg-gradient-to-br from-[#4facfe] to-[#00f2fe] rounded-3xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Detailed Section */}
      <section className="bg-[#FAFAFA] px-6 md:px-20 lg:px-32 xl:px-48 py-20">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-[17px] py-[7px] border border-[#E4E4E7] rounded-full font-medium text-base mb-4 bg-white">
              Features
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium leading-[1.25] mb-4 px-4">
              Build the perfect customer-facing AI agent
            </h2>
            <p className="text-lg text-[#71717B] max-w-[700px] mx-auto px-4">
              Chatbase gives you all the tools you need to train your perfect AI agent and connect it to your systems.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white border border-[#E4E4E7] rounded-2xl p-4">
              <div className="w-full h-[324px] bg-gradient-to-br from-[#fa709a] to-[#fee140] rounded-2xl mb-4"></div>
              <h3 className="text-2xl font-medium text-[#27272A] mb-2 px-5">Sync with real-time data</h3>
              <p className="text-[#71717B] text-base px-5 pb-5">
                Connect your agent to systems like order management tools, CRMs, and more to seamlessly access data ranging from order details to active subscriptions and beyond.
              </p>
            </div>
            <div className="bg-white border border-[#E4E4E7] rounded-2xl p-4">
              <div className="w-full h-[324px] bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-2xl mb-4"></div>
              <h3 className="text-2xl font-medium text-[#27272A] mb-2 px-5">Take actions on your systems</h3>
              <p className="text-[#71717B] text-base px-5 pb-5">
                Configure actions that your agent can perform within your systems or through one of our integrations, like updating a customer's subscription or changing their address.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-[#FAFAFA] px-6 md:px-20 lg:px-32 xl:px-48 py-20">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-[17px] py-[7px] border border-[#E4E4E7] rounded-full font-medium text-base mb-4 bg-white">
              Testimonials
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium leading-[1.25] mb-4 px-4">What people say</h2>
            <p className="text-lg text-[#71717B] max-w-[700px] mx-auto px-4">
              With over 9000 clients served, here's what they have to say
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-6 auto-rows-[minmax(200px,auto)] gap-6">
            {/* Large testimonial card */}
            <div className="col-span-1 md:col-span-3 row-span-1 bg-white border border-[#E4E4E7] rounded-2xl p-8 flex flex-col justify-between">
              <p className="text-base leading-[1.5] text-[#09090B] mb-6">
                "Chatbase is a strong signal of how customer support will evolve. It is an early adopter of the agentic approach, which will become increasingly effective, trusted, and prominent."
              </p>
              <div className="flex items-center gap-3 mt-auto">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] flex-shrink-0"></div>
                <div className="flex flex-col gap-1">
                  <div className="font-bold text-base text-[#09090B]">Marc Manara</div>
                  <div className="text-base text-[#71717B]">OpenAI</div>
                </div>
              </div>
            </div>

            {/* Stat card 1 */}
            <div className="col-span-1 md:col-span-3 row-span-1 bg-white border border-[#E4E4E7] rounded-2xl p-8 flex flex-col gap-4">
              <div className="w-full h-[168px] bg-gradient-to-br from-[#f093fb] to-[#f5576c] rounded-xl"></div>
              <div className="flex flex-col gap-2">
                <div className="text-[32px] font-medium text-[#09090B]">9000+</div>
                <div className="text-base text-[#71717B] leading-[1.5]">businesses trust Chatbase</div>
              </div>
            </div>

            {/* Medium testimonial card */}
            <div className="col-span-1 md:col-span-2 row-span-1 bg-white border border-[#E4E4E7] rounded-2xl p-8 flex flex-col justify-between">
              <p className="text-base leading-[1.5] text-[#09090B] mb-6">
                "This is awesome, thanks for building it!"
              </p>
              <div className="flex items-center gap-3 mt-auto">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] flex-shrink-0"></div>
                <div className="flex flex-col gap-1">
                  <div className="font-bold text-base text-[#09090B]">Logan Kilpatrick</div>
                  <div className="text-base text-[#71717B]">Google</div>
                </div>
              </div>
            </div>

            {/* Medium testimonial card 2 */}
            <div className="col-span-1 md:col-span-2 row-span-1 bg-white border border-[#E4E4E7] rounded-2xl p-8 flex flex-col justify-between">
              <p className="text-base leading-[1.5] text-[#09090B] mb-6">
                "An overpowered tool built with the OP stack."
              </p>
              <div className="flex items-center gap-3 mt-auto">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] flex-shrink-0"></div>
                <div className="flex flex-col gap-1">
                  <div className="font-bold text-base text-[#09090B]">Greg Kogan</div>
                  <div className="text-base text-[#71717B]">Pinecone</div>
                </div>
              </div>
            </div>

            {/* Stat card 2 */}
            <div className="col-span-1 md:col-span-2 row-span-1 bg-white border border-[#E4E4E7] rounded-2xl p-8 flex flex-col gap-4">
              <div className="w-full h-[168px] bg-gradient-to-br from-[#4facfe] to-[#00f2fe] rounded-xl"></div>
              <div className="flex flex-col gap-2">
                <div className="text-[32px] font-medium text-[#09090B]">140+</div>
                <div className="text-base text-[#71717B] leading-[1.5]">countries served</div>
              </div>
            </div>

            {/* Large testimonial card 2 */}
            <div className="col-span-1 md:col-span-2 row-span-1 bg-white border border-[#E4E4E7] rounded-2xl p-8 flex flex-col justify-between">
              <p className="text-base leading-[1.5] text-[#09090B] mb-6">
                "Our chatbot has been great. Answers questions it knows, delegates to our talent when its stuck, knows how to push clients to the funnel. Chatbase is what we use, 10/10 recommend."
              </p>
              <div className="flex items-center gap-3 mt-auto">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] flex-shrink-0"></div>
                <div className="flex flex-col gap-1">
                  <div className="font-bold text-base text-[#09090B]">Martin Terskin</div>
                  <div className="text-base text-[#71717B]">OfferMarket</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-white px-6 md:px-20 lg:px-32 xl:px-48 py-20">
        <div className="max-w-[1400px] mx-auto">
          <div className="relative overflow-hidden text-center py-24 bg-gradient-to-br from-[#667eea] via-[#764ba2] to-[#f093fb] rounded-3xl text-white px-10">
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium mb-6 leading-tight">Make customer experience your competitive edge</h2>
              <p className="text-lg mb-10 max-w-[600px] mx-auto opacity-95">
                Use Chatbase to deliver exceptional support experiences that set you apart from the competition.
              </p>
              <div className="flex flex-col items-center gap-5">
                <button className="bg-white text-[#09090B] px-8 py-4 border-none rounded-full font-bold text-base cursor-pointer shadow-[0px_4px_20px_rgba(0,0,0,0.15)] hover:shadow-[0px_6px_30px_rgba(0,0,0,0.25)] transition-all hover:scale-105">
                  Build your agent
                </button>
                <div className="flex items-center gap-2 text-white/90">
                  <span className="text-lg">✓</span>
                  <span className="text-base">No credit card required</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#09090B] text-white px-6 md:px-20 lg:px-32 xl:px-48 pt-24 pb-20">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between gap-10">
            <div className="flex flex-col gap-4">
              <div className="text-xl font-semibold">Chatbase</div>
              <p className="text-[#A1A1AA] font-medium">© 2025 Chatbase, Inc.</p>
            </div>
            <div className="flex flex-col md:flex-row gap-8 md:gap-32">
              <div className="flex flex-col gap-4">
                <h6 className="text-sm font-semibold tracking-[0.1em] text-[#FAFAFA]">PRODUCT</h6>
                <a href="#" className="text-[#A1A1AA] no-underline text-sm font-semibold hover:text-white">Customer Service</a>
                <a href="#" className="text-[#A1A1AA] no-underline text-sm font-semibold hover:text-white">Pricing</a>
                <a href="#" className="text-[#A1A1AA] no-underline text-sm font-semibold hover:text-white">Security</a>
                <a href="#" className="text-[#A1A1AA] no-underline text-sm font-semibold hover:text-white">Affiliates</a>
              </div>
              <div className="flex flex-col gap-4">
                <h6 className="text-sm font-semibold tracking-[0.1em] text-[#FAFAFA]">RESOURCES</h6>
                <a href="#" className="text-[#A1A1AA] no-underline text-sm font-semibold hover:text-white">Contact us</a>
                <a href="#" className="text-[#A1A1AA] no-underline text-sm font-semibold hover:text-white">API</a>
                <a href="#" className="text-[#A1A1AA] no-underline text-sm font-semibold hover:text-white">Guide</a>
                <a href="#" className="text-[#A1A1AA] no-underline text-sm font-semibold hover:text-white">Blog</a>
              </div>
              <div className="flex flex-col gap-4">
                <h6 className="text-sm font-semibold tracking-[0.1em] text-[#FAFAFA]">COMPANY</h6>
                <a href="#" className="text-[#A1A1AA] no-underline text-sm font-semibold hover:text-white">Careers</a>
                <a href="#" className="text-[#A1A1AA] no-underline text-sm font-semibold hover:text-white">Privacy policy</a>
                <a href="#" className="text-[#A1A1AA] no-underline text-sm font-semibold hover:text-white">Terms of service</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
