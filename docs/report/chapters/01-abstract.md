# Applied Software Project

## Abstract

Online ticket booking for movies is deceptively hard to get right: many users can try to reserve the same seat within milliseconds of each other, payments must be confirmed asynchronously without ever double-charging or double-booking a customer, and the platform must serve three kinds of users — moviegoers, theatre owners, and administrators — each with different access and write privileges. **TicketVerse** is a full-stack, production-representative movie ticket booking platform built to solve this problem, developed as an Applied Software Project using the MERN stack (MongoDB, Express, React, Node.js) inside a TypeScript monorepo.

The purpose was to design and ship a working, secure, independently deployed system covering the full customer journey — browsing movies and showtimes, selecting seats on a live seat map, holding seats safely under concurrent demand, paying through a real payment gateway, and receiving asynchronous confirmation — alongside role-based dashboards for theatre owners (managing screens and showtimes) and administrators (approving theatre-owner requests, curating the movie catalogue, and auditing bookings).

The methods applied include a Domain-Driven Design backend with clearly separated domain, application, infrastructure, and HTTP layers; Redis-based atomic seat holds (`SETNX` with a time-to-live) to prevent double-booking without locking the database; Stripe PaymentIntents and signature-verified webhooks for asynchronous, PCI-DSS-aligned payment confirmation; custom bcrypt password hashing with rotating JWT access/refresh tokens in httpOnly cookies; and a shared Zod schema package validating data identically on both backend and frontend.

The result is a fully tested (26 automated tests), fully deployed system — backend on Render, frontend on Netlify, database on MongoDB Atlas, cache/lock store on Upstash Redis — showing that the seat-hold and webhook-confirmation patterns used by real-world ticketing platforms can be reproduced correctly, securely, and economically on free-tier infrastructure.
