/**
 * Server-safe factory for a blank UI order. Used by the "New order" page to
 * seed the form before Alan starts typing.
 *
 * Why this is its own module (not DEFAULT_ORDER from order-form/shared.tsx):
 * the order-form modules are `'use client'`, and crossing the RSC boundary
 * with a deeply nested const object imported from a client module was
 * dropping sub-objects in Next 15's serializer at the prop edge. Constructing
 * the shape in a plain (non-"use client") server module avoids that path.
 */

import type { Order as UiOrder } from '@/components/order-form'

export function emptyOrder(): UiOrder {
  return {
    orderType: 'business',
    financeType: 'BCH',
    customer: {
      salutation: 'Mr',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dob: '',
      company: '',
      companyNumber: '',
      vatNumber: '',
      position: '',
      billingAddress: '',
      billingCity: '',
      billingPostcode: '',
      billingCountry: 'United Kingdom',
    },
    vehicle: {
      category: 'Passenger Car',
      make: '',
      model: '',
      derivative: '',
      fuel: 'Petrol',
      transmission: 'Manual',
      colour: '',
      trim: '',
      registration: 'New Plate (26-reg)',
      co2: 0,
    },
    options: [],
    delivery: {
      method: 'Driven to address',
      address: '',
      city: '',
      postcode: '',
      preferredDate: '',
      contact: '',
      contactPhone: '',
      notes: '',
    },
    pricing: {
      vehicleNet: 0,
      discount: 0,
      vatRate: 20,
      ved: 0,
      firstRegFee: 55,
      deliveryFee: 0,
      numberPlates: 0,
    },
    finance: {
      term: 48,
      annualMileage: 10000,
      initialRental: 6,
      monthlyNet: 0,
      balloon: 0,
    },
    addons: {
      maintenance: false,
      maintenanceMonthly: 0,
      gap: false,
      gapTotal: 0,
      tyreCover: false,
      tyreMonthly: 0,
      breakdown: false,
      breakdownMonthly: 0,
    },
    partExchange: {
      enabled: false,
      reg: '',
      make: '',
      model: '',
      mileage: '',
      condition: 'Good',
      valuation: 0,
      outstandingFinance: 0,
    },
    notes: '',
    consent: { terms: false, gdpr: false, marketing: false, fcaDisclosure: false },
    signatures: {
      customer: { signed: false, method: 'pending', name: '', signedAt: null, ip: null },
      representative: {
        signed: false,
        method: 'pending',
        name: '',
        signedAt: null,
        ip: null,
      },
    },
  }
}
