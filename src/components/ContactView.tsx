import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, ChevronDown, CheckCircle2 } from 'lucide-react';

interface ContactViewProps {
  onSendMessage: (msg: { name: string; email: string; phone?: string; subject: string; message: string }) => void;
}

export const ContactView: React.FC<ContactViewProps> = ({ onSendMessage }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sentSuccess, setSentSuccess] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How do I receive my 80G Tax Exemption Receipt?',
      a: 'Tax receipts are generated immediately upon successful donation completion. You can download it directly from the confirmation modal or locate it via your registered email address.'
    },
    {
      q: 'What percentage of my donation goes directly to ground causes?',
      a: 'Over 92% of funds go directly towards program implementation and beneficiary disbursements, with less than 8% allocated for essential technology, logistics, and third-party financial audits.'
    },
    {
      q: 'Can I visit or volunteer at the field camps?',
      a: 'Yes! We actively welcome volunteers, doctors, educators, and field monitors. Send us a message via this contact form or register as a Volunteer Member.'
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;

    onSendMessage({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      subject: subject.trim() || 'General Inquiry',
      message: message.trim()
    });

    setSentSuccess(true);
    setName('');
    setEmail('');
    setPhone('');
    setSubject('');
    setMessage('');
    setTimeout(() => setSentSuccess(false), 6000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 animate-fadeIn">
      {/* Title */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-bold uppercase tracking-widest text-teal-400 bg-teal-500/10 px-3.5 py-1.5 rounded-full border border-teal-500/20">
          Get In Touch
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Contact NGO Fund Management Team
        </h1>
        <p className="text-slate-300 text-sm sm:text-base">
          Have questions about fund allocation, corporate partnerships, or volunteer programs? We are here to assist.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Info Cards */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-850 p-5 rounded-2xl border border-slate-800 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-white text-sm">Global Headquarters</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Global NGO Tower, Suite 400, Financial District, NY &amp; MG Road, New Delhi
              </p>
            </div>
          </div>

          <div className="bg-slate-850 p-5 rounded-2xl border border-slate-800 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-white text-sm">24/7 Helpline &amp; Inquiries</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                +1 (800) 456-7890 / +91 98765 43210
              </p>
            </div>
          </div>

          <div className="bg-slate-850 p-5 rounded-2xl border border-slate-800 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-white text-sm">Official Email</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                contact@ngofunds.org / support@ngofunds.org
              </p>
            </div>
          </div>

          <div className="bg-slate-850 p-5 rounded-2xl border border-slate-800 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-white text-sm">Audit &amp; Operational Hours</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Monday – Saturday: 9:00 AM – 6:00 PM (Emergency Desk 24/7)
              </p>
            </div>
          </div>
        </div>

        {/* Right: Contact Form */}
        <div className="lg:col-span-7 bg-slate-850 p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Send className="w-5 h-5 text-teal-400" />
            <h3 className="font-bold text-white text-lg">Send Direct Inquiry</h3>
          </div>

          {sentSuccess && (
            <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Thank you! Your message has been received by our leadership desk.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Your Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. john@example.com"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Phone Number (Optional)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Subject / Category</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Donation Receipt / Aid Inquiry"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">Your Message *</label>
              <textarea
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message or inquiry here..."
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-lg shadow-teal-600/25 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Send Direct Message</span>
            </button>
          </form>
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="pt-6 border-t border-slate-800 space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-400">Common Inquiries</span>
          <h3 className="text-xl sm:text-2xl font-bold text-white">Frequently Asked Questions</h3>
        </div>

        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="bg-slate-850 rounded-xl border border-slate-800 overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 text-left flex justify-between items-center font-semibold text-white text-xs sm:text-sm hover:text-teal-300"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-teal-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/80 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
