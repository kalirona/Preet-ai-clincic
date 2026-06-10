import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  Phone, 
  Mail, 
  User, 
  Scissors, 
  ArrowRight, 
  AlertCircle, 
  DollarSign, 
  Check, 
  ArrowLeft 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';

interface Service {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
}

interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
}

export default function BookPublic() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const activeSlug = slug || searchParams.get('slug') || 'salon-a';

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Loaded Config
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);

  // User Choices
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');

  // Personal Info Form
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    notes: ''
  });

  // Success Confirmation State
  const [confirmedBooking, setConfirmedBooking] = useState<any | null>(null);

  // Fetch Service Details & Dates on load
  useEffect(() => {
    async function loadBookingPage() {
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get(`/api/public/booking/${activeSlug}`);
        
        setWorkspace(res.data.workspace);
        setServices(res.data.services);
        setAvailableDates(res.data.availableDates);
        setAvailableTimeSlots(res.data.availableTimeSlots);
        
        // Auto-select first service as default
        if (res.data.services && res.data.services.length > 0) {
          setSelectedService(res.data.services[0]);
        }
        
        // Auto-select first date as default
        if (res.data.availableDates && res.data.availableDates.length > 0) {
          setSelectedDate(res.data.availableDates[0]);
        }
      } catch (err: any) {
        console.error('Failed to load booking details:', err);
        setError('We could not retrieve the booking config for this salon slug. Please review the URL.');
      } finally {
        setLoading(false);
      }
    }
    loadBookingPage();
  }, [activeSlug]);

  // Handle Booking Submit
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedDate || !selectedTime) {
      setError('Please finalize your chosen service, date, and time slot first.');
      return;
    }
    if (!form.firstName.trim() || !form.email.trim()) {
      setError('First name and email coordinates are strictly required.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      const payload = {
        slug: activeSlug,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        serviceId: selectedService.id,
        date: selectedDate,
        timeSlot: selectedTime,
        notes: form.notes
      };

      const res = await axios.post('/api/public/booking/book', payload);
      setConfirmedBooking({
        ...res.data.booking,
        serviceName: selectedService.name,
        price: selectedService.price,
        durationMinutes: selectedService.durationMinutes
      });
    } catch (err: any) {
      console.error('Submit booking failed:', err);
      setError(err.response?.data?.error || 'A problem occurred scheduling your appointment. Please retry.');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper formats
  const formatFriendlyDate = (isoDateStr: string) => {
    if (!isoDateStr) return '';
    const dateObj = new Date(isoDateStr + 'T00:00:00');
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDayNumber = (isoDateStr: string) => {
    if (!isoDateStr) return '';
    return isoDateStr.split('-')[2];
  };

  const getMonthLabel = (isoDateStr: string) => {
    if (!isoDateStr) return '';
    const dateObj = new Date(isoDateStr + 'T00:00:00');
    return dateObj.toLocaleDateString('en-US', { month: 'short' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Initialising Salon Booking Canvas...</p>
        </div>
      </div>
    );
  }

  if (confirmedBooking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full max-w-lg"
        >
          <Card className="border-emerald-100 shadow-xl bg-white overflow-hidden">
            <div className="h-2 bg-emerald-500 w-full" />
            <CardHeader className="text-center pt-8">
              <div className="mx-auto w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mb-4 border border-emerald-100">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <CardTitle className="text-2xl font-extrabold tracking-tight text-slate-900" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
                Booking Confirmed!
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 font-medium mt-1">
                Your high performance session is officially locked.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Service Recap Card */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-black tracking-widest text-indigo-600 uppercase">Selected Service</span>
                    <h3 className="text-sm font-bold text-slate-800 mt-0.5">{confirmedBooking.serviceName}</h3>
                  </div>
                  <span className="text-xs font-black text-slate-900 bg-white border border-slate-200 px-2.5 py-1 rounded-md">
                    ${confirmedBooking.price}
                  </span>
                </div>
                
                <hr className="border-slate-200" />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase block">Scheduled Date</span>
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mt-1">
                      <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                      {formatFriendlyDate(confirmedBooking.date)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase block">Selected Time</span>
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mt-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" />
                      {confirmedBooking.timeSlot}
                    </span>
                  </div>
                </div>
              </div>

              {/* Client Coordinates */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Reserving Guest</h4>
                <div className="text-xs text-slate-700 space-y-1 bg-white p-3 rounded-lg border border-slate-100">
                  <p className="font-bold">{confirmedBooking.clientName}</p>
                  <p className="text-slate-500">{form.email}</p>
                  {form.phone && <p className="text-slate-500">{form.phone}</p>}
                </div>
              </div>

              <div className="text-center text-[11px] text-slate-500 leading-relaxed font-medium px-4">
                You will receive automated emails and reminders concerning your service reservation. For urgent changes, please contact the administrator:
                <div className="mt-2 text-indigo-600 font-bold space-y-0.5">
                  <p>{workspace?.contactEmail}</p>
                  <p>{workspace?.contactPhone}</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50 border-t border-slate-100 p-4 flex justify-center">
              <Button 
                variant="outline" 
                className="w-full bg-white text-xs font-black uppercase text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-800 transition"
                onClick={() => setConfirmedBooking(null)}
              >
                Schedule Another Service
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Salon Welcome Branding */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-600 text-[10px] font-bold uppercase tracking-widest">
            <Sparkles className="w-3 h-3 text-indigo-500" />
            <span>Secure Guest Scheduling Panel</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
            {workspace?.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
            {workspace?.description}
          </p>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl flex items-start gap-3 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Execution Error</p>
              <p className="mt-0.5 text-rose-600">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Selectors Column */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Step 1: Choose Service */}
            <Card className="border-slate-200 shadow-sm bg-white">
              <CardHeader className="pb-4">
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Step One</span>
                <CardTitle className="text-lg font-extrabold text-slate-800" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
                  Select Service Category
                </CardTitle>
                <CardDescription className="text-xs text-slate-400 font-medium">
                  Select a bespoke beauty or counseling slot.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {services.map((service) => {
                  const isSelected = selectedService?.id === service.id;
                  return (
                    <div 
                      key={service.id}
                      onClick={() => setSelectedService(service)}
                      className={`p-4 rounded-xl border text-left cursor-pointer transition flex items-center justify-between ${
                        isSelected 
                          ? 'border-indigo-600 bg-indigo-50/40 shadow-xs' 
                          : 'border-slate-150 bg-white hover:border-slate-350 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-extrabold text-slate-900">{service.name}</h4>
                          {isSelected && <span className="w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center text-white"><Check className="w-2.5 h-2.5" /></span>}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{service.durationMinutes} Minutes</span>
                        </div>
                      </div>
                      <span className="text-xs font-black text-slate-900 px-3 py-1.5 bg-slate-100 rounded-lg">
                        ${service.price}
                      </span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Step 2: Choose Date & Time */}
            <Card className="border-slate-200 shadow-sm bg-white">
              <CardHeader className="pb-4">
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Step Two</span>
                <CardTitle className="text-lg font-extrabold text-slate-800" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
                  Choose Schedule Details
                </CardTitle>
                <CardDescription className="text-xs text-slate-400 font-medium">
                  Select your desired appointment date and corresponding hour block.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Horizontal Date Picker */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Available Calendar Days</span>
                  <div className="flex gap-2.5 overflow-x-auto pb-2 snap-x scrollbar-thin">
                    {availableDates.map((dateStr) => {
                      const isSelected = selectedDate === dateStr;
                      return (
                        <button
                          key={dateStr}
                          type="button"
                          onClick={() => {
                            setSelectedDate(dateStr);
                            setSelectedTime(''); // reset timeslot when date shifts
                          }}
                          className={`snap-center shrink-0 w-16 p-2 rounded-xl flex flex-col items-center justify-center border transition ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-350 hover:bg-slate-50'
                          }`}
                        >
                          <span className={`text-[9px] font-bold uppercase ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                            {formatFriendlyDate(dateStr).split(',')[0]}
                          </span>
                          <span className="text-lg font-black tracking-tight my-0.5">
                            {getDayNumber(dateStr)}
                          </span>
                          <span className={`text-[9px] font-extrabold uppercase ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                            {getMonthLabel(dateStr)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Vertical Hour Selectors */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Available Times</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {availableTimeSlots.map((timeStr) => {
                      const isSelected = selectedTime === timeStr;
                      return (
                        <button
                          key={timeStr}
                          type="button"
                          onClick={() => setSelectedTime(timeStr)}
                          className={`p-2.5 text-center text-xs font-bold rounded-lg border transition ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white hover:border-slate-350'
                          }`}
                        >
                          {timeStr}
                        </button>
                      );
                    })}
                  </div>
                </div>

              </CardContent>
            </Card>

          </div>

          {/* Guest Context Registration Form Column */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="border-slate-200 shadow-md bg-white sticky top-6">
              <form onSubmit={handleBookingSubmit}>
                <CardHeader className="pb-4">
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Step Three</span>
                  <CardTitle className="text-lg font-extrabold text-slate-800" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
                    Personal Details
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-400 font-medium">
                    Submit guest metadata to register you.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  {/* First Name */}
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-slate-700 uppercase">First Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <Input 
                        placeholder="Jean-Paul" 
                        required
                        className="pl-9 text-xs"
                        value={form.firstName}
                        onChange={e => setForm(prev => ({ ...prev, firstName: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Last Name */}
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-slate-700 uppercase">Last Name</Label>
                    <Input 
                      placeholder="Sartre"
                      className="text-xs"
                      value={form.lastName}
                      onChange={e => setForm(prev => ({ ...prev, lastName: e.target.value }))}
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-slate-700 uppercase">Email Address *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <Input 
                        type="email"
                        placeholder="jeanpaul@existentialist.com" 
                        required
                        className="pl-9 text-xs"
                        value={form.email}
                        onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-slate-700 uppercase">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <Input 
                        type="tel"
                        placeholder="+33 1 45 42 12..." 
                        className="pl-9 text-xs"
                        value={form.phone}
                        onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Notes / Special considerations */}
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-slate-700 uppercase">Special considerations / Notes</Label>
                    <Textarea 
                      placeholder="Any specific requests or detail constraints for the Senior Stylist." 
                      className="text-xs min-h-[80px]"
                      value={form.notes}
                      onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                    />
                  </div>

                </CardContent>

                <CardFooter className="flex flex-col gap-3 pt-2">
                  
                  {/* Selected Slot Recap */}
                  {selectedService && selectedDate && selectedTime && (
                    <div className="w-full text-left p-3.5 bg-slate-50 border border-slate-150 rounded-xl space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-extrabold text-slate-800 shrink-0">{selectedService.name}</span>
                        <span className="font-black text-slate-900">${selectedService.price}</span>
                      </div>
                      <p className="text-[10px] font-bold text-indigo-600 uppercase flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatFriendlyDate(selectedDate)} at {selectedTime}
                      </p>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    disabled={submitting || !selectedService || !selectedDate || !selectedTime}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-xs font-black uppercase text-white tracking-widest py-5 flex items-center justify-center gap-2"
                  >
                    {submitting ? 'Confirming Reservation...' : 'Complete Self-Booking'}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>

        </div>

      </div>
    </div>
  );
}
