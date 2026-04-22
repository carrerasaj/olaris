// Variant B — Multi-step wizard with progress tracker and review screen.

const WIZARD_STEPS = [
  { id: 'customer',   label: 'Customer',      num: '01' },
  { id: 'vehicle',    label: 'Vehicle',       num: '02' },
  { id: 'options',    label: 'Options',       num: '03' },
  { id: 'pricing',    label: 'Pricing',       num: '04' },
  { id: 'finance',    label: 'Finance',       num: '05' },
  { id: 'delivery',   label: 'Delivery',      num: '06' },
  { id: 'review',     label: 'Review & sign', num: '07' },
];

function FormWizard({ order, set, calc, saveStatus, saveAt, partExEnabled }) {
  const orderRef = React.useMemo(() => 'OL-2026-04-8F3K', []);
  const [step, setStep] = React.useState(0);
  const totalSteps = WIZARD_STEPS.length;
  const currentStep = WIZARD_STEPS[step];
  const progressPct = ((step + 1) / totalSteps) * 100;

  const go = (d) => setStep(s => Math.max(0, Math.min(totalSteps - 1, s + d)));

  return (
    <div className="ol-artboard">
      <Topbar orderRef={orderRef} saveStatus={saveStatus} saveAt={saveAt} />

      {/* Progress header */}
      <div style={{ background: '#fff', borderBottom: '1px solid var(--ol-line)' }}>
        <div style={{ padding: '18px 32px 0' }}>
          <div className="ol-row-between" style={{ marginBottom: 14 }}>
            <div>
              <div className="ol-mini">Step {step + 1} of {totalSteps}</div>
              <div style={{ fontFamily: 'var(--ol-font-display)', fontSize: 22, fontWeight: 700, color: 'var(--ol-navy-900)', letterSpacing: '-0.02em', marginTop: 2 }}>
                {currentStep.label}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Pill tone="navy">{order.financeType}</Pill>
              <Pill tone="cyan">{order.vehicle.make} {order.vehicle.model}</Pill>
              <div className="ol-mono" style={{ fontSize: 11, color: 'var(--ol-ink-500)', letterSpacing: '0.04em' }}>
                {fmtGBP(calc.total)} total
              </div>
            </div>
          </div>
          <div className="ol-progress-bar">
            <div className="ol-progress-bar-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
        <div className="ol-progress">
          {WIZARD_STEPS.map((s, i) => (
            <div key={s.id}
              className={`ol-progress-step ${i < step ? 'is-done' : ''} ${i === step ? 'is-current' : ''}`}
              onClick={() => setStep(i)}>
              <div className="ol-progress-num">{s.num} {i < step && '✓'}</div>
              <div className="ol-progress-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Step body */}
      <div style={{ padding: '24px 32px 0', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 24 }}>
        <div className="ol-step-fade" key={step}>
          {currentStep.id === 'customer' && (
            <SectionCard title="Customer & company details" sub="Individual or business — the VAT position depends on this.">
              <CustomerSection order={order} set={set} />
            </SectionCard>
          )}
          {currentStep.id === 'vehicle' && (
            <>
              <SectionCard title="Vehicle specification" sub="Make, model, derivative and fit-out">
                <VehicleSection order={order} set={set} />
              </SectionCard>
              {partExEnabled && (
                <SectionCard title="Part-exchange" sub="Vehicle being traded in">
                  <PartExSection order={order} set={set} />
                </SectionCard>
              )}
            </>
          )}
          {currentStep.id === 'options' && (
            <SectionCard title="Factory options & accessories" sub="Each line is VAT-rated individually">
              <OptionsSection order={order} set={set} />
            </SectionCard>
          )}
          {currentStep.id === 'pricing' && (
            <SectionCard title="Pricing breakdown" sub="Auto-calculates VAT and on-the-road costs">
              <PricingSection order={order} set={set} calc={calc} />
            </SectionCard>
          )}
          {currentStep.id === 'finance' && (
            <>
              <SectionCard title="Finance terms" sub="Select product, term and monthly rental">
                <FinanceSection order={order} set={set} calc={calc} />
              </SectionCard>
              <SectionCard title="Add-ons & cover" sub="Optional maintenance and protection bundles">
                <AddonsSection order={order} set={set} />
              </SectionCard>
            </>
          )}
          {currentStep.id === 'delivery' && (
            <>
              <SectionCard title="Delivery" sub="Where, when and who signs for the vehicle">
                <DeliverySection order={order} set={set} />
              </SectionCard>
              <SectionCard title="Documents" sub="Upload verification documents">
                <DocsSection />
              </SectionCard>
            </>
          )}
          {currentStep.id === 'review' && (
            <>
              <SectionCard title="Review order" sub="Confirm everything before e-signature is requested" right={<Pill tone="amber">Final step</Pill>}>
                <ReviewBlock order={order} calc={calc} />
              </SectionCard>
              <SectionCard title="Consents & disclosures">
                <ConsentSection order={order} set={set} />
              </SectionCard>
              <SectionCard title="E-signature" sub="DocuSign envelope · 2 recipients">
                <div className="ol-stack" style={{ gap: 14 }}>
                  <DocuSignStrip envelopeId="ENV-H7M2-4X9P" recipients={2} />
                  <SignatureBlock
                    role="Customer signature · Recipient 1"
                    signer={order.signatures.customer}
                    anchor="\\ol:sig1\\"
                    onSign={() => set('signatures.customer', { signed: true, method: 'draw', name: order.customer.firstName + ' ' + order.customer.lastName, signedAt: new Date().toISOString(), ip: '82.12.44.199' })}
                  />
                  <SignatureBlock
                    role="Olaris representative · Recipient 2"
                    signer={order.signatures.representative}
                    anchor="\\ol:sig2\\"
                  />
                </div>
              </SectionCard>
            </>
          )}

          {/* Nav */}
          <div className="ol-formfooter" style={{ marginTop: 10 }}>
            <button className="ol-btn ol-btn-ghost" onClick={() => go(-1)} disabled={step === 0} style={step === 0 ? { opacity: .4 } : {}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>
              Back
            </button>
            <div style={{ fontSize: 12, color: 'var(--ol-ink-500)' }}>
              Step <strong className="ol-mono" style={{ color: 'var(--ol-ink-900)' }}>{step + 1}</strong> of {totalSteps} · Draft <strong className="ol-mono" style={{ color: 'var(--ol-ink-900)' }}>{orderRef}</strong>
            </div>
            {step < totalSteps - 1 ? (
              <button className="ol-btn ol-btn-primary" onClick={() => go(1)}>
                Next step
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              </button>
            ) : (
              <button className="ol-btn ol-btn-primary">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L3 7l9 5 9-5-9-5z"/><path d="M3 17l9 5 9-5"/><path d="M3 12l9 5 9-5"/></svg>
                Send envelope
              </button>
            )}
          </div>
        </div>

        {/* Sidebar with running summary */}
        <aside>
          <div className="ol-summary" style={{ top: 24 }}>
            <h3>Running Total</h3>
            <div className="ol-summary-vehicle">{order.vehicle.make} {order.vehicle.model}</div>
            <div className="ol-summary-trim">{order.vehicle.derivative}</div>

            <div className="ol-summary-row"><span>Net (inc. options)</span><span className="v">{fmtGBP(calc.netBeforeVat)}</span></div>
            <div className="ol-summary-row"><span>VAT @ {order.pricing.vatRate}%</span><span className="v">{fmtGBP(calc.vat)}</span></div>
            <div className="ol-summary-row"><span>VED + OTR</span><span className="v">{fmtGBP(calc.onRoad)}</span></div>

            <div className="ol-summary-total">
              <div className="lbl">Drive-away</div>
              <div className="amt">{fmtGBP(calc.total)}</div>
            </div>

            {order.financeType !== 'OP' && (
              <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(34,211,238,0.08)', borderRadius: 8, border: '1px solid rgba(125,211,252,0.3)' }}>
                <div style={{ fontSize: 10.5, color: '#7dd3fc', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Monthly</div>
                <div style={{ fontFamily: 'var(--ol-font-display)', fontSize: 20, fontWeight: 700, color: '#fff', marginTop: 2 }}>{fmtGBP(calc.monthlyTotal)}<span style={{ fontSize: 11, color: '#7dd3fc', fontWeight: 500, marginLeft: 6 }}>+ VAT</span></div>
              </div>
            )}

            <div className="ol-summary-footer">
              {step === totalSteps - 1 ? 'All steps complete — ready to send for e-signature.' : `${totalSteps - step - 1} step${totalSteps - step - 1 === 1 ? '' : 's'} remaining`}
            </div>
          </div>

          {/* Helpful tips card — contextual */}
          <div style={{ marginTop: 14, padding: '14px 16px', background: '#fff', border: '1px solid var(--ol-line)', borderRadius: 10 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 26, height: 26, borderRadius: 6, background: 'var(--ol-cyan-50)', color: 'var(--ol-cyan-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 9v4M12 17h.01"/><circle cx="12" cy="12" r="10"/></svg>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ol-navy-900)', marginBottom: 4 }}>
                  {currentStep.id === 'pricing' ? 'VAT & VED reminder' :
                   currentStep.id === 'finance' ? 'Finance product tip' :
                   currentStep.id === 'customer' ? 'Business vs personal' :
                   currentStep.id === 'review' ? 'Signing order' :
                   'About this step'}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--ol-ink-500)', lineHeight: 1.5 }}>
                  {currentStep.id === 'pricing' && 'VAT auto-calculates on net + options (less discount). VED is first-year rate — check band against CO₂.'}
                  {currentStep.id === 'finance' && 'BCH = lease, VAT reclaimable for businesses. Contract Purchase has an optional balloon.'}
                  {currentStep.id === 'customer' && 'Business orders reclaim VAT (where applicable). Personal orders show VAT-inclusive headlines.'}
                  {currentStep.id === 'vehicle' && 'Derivative string should match manufacturer configurator for exact build slot matching.'}
                  {currentStep.id === 'options' && 'Each line carries its own VAT rate. Zero-rated items (e.g. disability adaptations) use 0%.'}
                  {currentStep.id === 'delivery' && 'Driver will confirm delivery window 48 hrs prior. Postcode determines transporter zone fee.'}
                  {currentStep.id === 'review' && 'Customer signs first, then Olaris representative. Envelope returns a fully executed PDF.'}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
      <div style={{ height: 32 }} />
    </div>
  );
}

function ReviewBlock({ order, calc }) {
  const Row = ({ k, v }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--ol-line)', fontSize: 13 }}>
      <span style={{ color: 'var(--ol-ink-500)' }}>{k}</span>
      <span style={{ color: 'var(--ol-ink-900)', fontWeight: 500, textAlign: 'right', fontFamily: /£/.test(String(v)) ? 'var(--ol-font-mono)' : 'inherit' }}>{v}</span>
    </div>
  );
  return (
    <div className="ol-grid ol-grid-2" style={{ gap: 20 }}>
      <div>
        <div className="ol-mini" style={{ marginBottom: 8 }}>Customer</div>
        <Row k="Name"      v={`${order.customer.salutation} ${order.customer.firstName} ${order.customer.lastName}`} />
        <Row k="Company"   v={order.customer.company || '—'} />
        <Row k="Email"     v={order.customer.email} />
        <Row k="Phone"     v={order.customer.phone} />
        <Row k="Billing"   v={`${order.customer.billingAddress}, ${order.customer.billingCity}, ${order.customer.billingPostcode}`} />

        <div className="ol-mini" style={{ margin: '20px 0 8px' }}>Vehicle</div>
        <Row k="Model"      v={`${order.vehicle.make} ${order.vehicle.model}`} />
        <Row k="Derivative" v={order.vehicle.derivative} />
        <Row k="Fuel/gearbox" v={`${order.vehicle.fuel} · ${order.vehicle.transmission}`} />
        <Row k="Colour/trim" v={`${order.vehicle.colour} · ${order.vehicle.trim}`} />
        <Row k="CO₂"        v={`${order.vehicle.co2} g/km`} />

        <div className="ol-mini" style={{ margin: '20px 0 8px' }}>Delivery</div>
        <Row k="Method"     v={order.delivery.method} />
        <Row k="Address"    v={`${order.delivery.address}, ${order.delivery.postcode}`} />
        <Row k="Preferred"  v={order.delivery.preferredDate} />
      </div>
      <div>
        <div className="ol-mini" style={{ marginBottom: 8 }}>Finance</div>
        <Row k="Product"    v={order.financeType} />
        <Row k="Term"       v={`${order.finance.term} months`} />
        <Row k="Mileage"    v={`${order.finance.annualMileage.toLocaleString()} pa`} />
        <Row k="Initial"    v={`${order.finance.initialRental} × monthly`} />
        <Row k="Monthly"    v={`${fmtGBP(calc.monthlyTotal)} + VAT`} />

        <div className="ol-mini" style={{ margin: '20px 0 8px' }}>Pricing</div>
        <Row k="Vehicle net" v={fmtGBP(order.pricing.vehicleNet - order.pricing.discount)} />
        <Row k="Options"    v={fmtGBP(calc.optionsNet)} />
        <Row k="VAT"        v={fmtGBP(calc.vat)} />
        <Row k="VED"        v={fmtGBP(order.pricing.ved)} />
        <Row k="On-the-road" v={fmtGBP(calc.onRoad)} />
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 4px', borderTop: '2px solid var(--ol-navy-900)', marginTop: 6 }}>
          <span style={{ fontWeight: 700, color: 'var(--ol-navy-900)', fontSize: 14 }}>Drive-away total</span>
          <span style={{ fontWeight: 700, color: 'var(--ol-navy-900)', fontSize: 18, fontFamily: 'var(--ol-font-mono)' }}>{fmtGBP(calc.total)}</span>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { FormWizard });
