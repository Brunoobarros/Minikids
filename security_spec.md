# Security Specification: Camisa 7

This document outlines the security requirements, data invariants, and access control policies for the Camisa 7 Firestore database.

## 1. Data Invariants
- **Products**: Must have a valid ID, name, category, price, and stock. Price and stock must be non-negative.
- **Banners**: Must have a title, subtitle, image, and a call-to-action button text. Only admins can create/update banners.
- **Orders**: Must have customer details (name, email, phone), an array of order items, and a standard reservation state (`reservado`, `pago`, `retirado`, `cancelado`). Once an order status is marked as `retirado` or `cancelado`, it is considered locked and final unless edited by an administrative profile.

## 2. Identity and Role Boundaries (ABAC / Zero-Trust)
- **Unauthenticated/Authenticated Visitors**: Can read all products and banners. Anyone can submit (create) a reservation order.
- **Admins**: Users with authenticated credentials registered under `/admins/{adminId}` can create, read, update, and delete products, banners, and orders.
- Since standard Firebase Authentication doesn't carry user claims on mock configurations, administrative access is checked via existence proof of a document under the `/admins/{userId}` path, or when using an authenticated administrative email verified pattern.

## 3. The "Dirty Dozen" Vulnerability Attacks Blocked
1. **Unsigned-In Write to Products**: An anonymous user attempts to inject a fake product into `/products`. (Status: BLOCKED)
2. **Product Price Poisoning**: Authenticated non-admin attempts to change product price to `0` or negative values. (Status: BLOCKED)
3. **Banner Injection Spoofing**: Injecting unauthorized banner cards leading to malicious phishing domains. (Status: BLOCKED)
4. **Order State Modification by Customer**: Customer tries to set their order state directly to `pago` or `retirado` without visiting physical store checkouts. (Status: BLOCKED)
5. **Unauthorized Banner Deletion**: Anyone except an authorized store admin deleting critical campaign sliders. (Status: BLOCKED)
6. **Negative Inventory Injector**: Creating products with negative stock values to crash shopping carts. (Status: BLOCKED)
7. **Bypassing Immutable Fields (Order Timestamp)**: Changing the `createdAt` or standard transaction timestamp fields. (Status: BLOCKED)
8. **Malicious ID injection**: Path variable poisoning using long or non-alphanumeric IDs like `/products/malicious_item_!@@#$`. (Status: BLOCKED)
9. **Email Spoofing Attack**: Gaining database access using standard headers with unverified client emails. (Status: BLOCKED)
10. **Shadow Key Exploit**: Overwriting document fields using unexpected system keys like `isAdmin: true` on random profiles. (Status: BLOCKED)
11. **Order Modification After Termination**: Tampering with a finalized/completed (`retirado` or `cancelado`) reservation status. (Status: BLOCKED)
12. **PII Leak on Customer Info**: Random users reading other customers' personal phone numbers and emails inside `/orders`. (Status: BLOCKED)

## 4. The "Dirty Dozen" Payload Specifications (Malicious JSON attempts)

Below are the 12 specific payloads mapped to our blocked scenarios:

```json
/* Payload 1: Unsigned-In Write to Products */
{
  "path": "/products/fake-jersey",
  "method": "create",
  "auth": null,
  "data": { "id": "fake-jersey", "name": "Fake Manto", "category": "esportivo", "price": 0.0, "stock": 99, "images": ["fake.png"] }
}

/* Payload 2: Product Price Poisoning */
{
  "path": "/products/manto-brasil",
  "method": "update",
  "auth": { "uid": "cust-1", "token": { "email": "customer@email.com", "email_verified": true } },
  "data": { "price": -10.0 }
}

/* Payload 3: Banner Injection Spoofing */
{
  "path": "/banners/fake-banner",
  "method": "create",
  "auth": { "uid": "attacker-1", "token": { "email": "attacker@email.com", "email_verified": true } },
  "data": { "id": "fake-banner", "title": "Phishing Banner", "subtitle": "Click Here", "image": "malicious.png", "buttonText": "Get Free" }
}

/* Payload 4: Order State Modification by Customer */
{
  "path": "/orders/PED-1234",
  "method": "update",
  "auth": { "uid": "cust-2", "token": { "email": "customer@email.com", "email_verified": true } },
  "data": { "status": "retirado" }
}

/* Payload 5: Unauthorized Banner Deletion */
{
  "path": "/banners/banner-brasil",
  "method": "delete",
  "auth": { "uid": "cust-3", "token": { "email": "customer@email.com", "email_verified": true } }
}

/* Payload 6: Negative Inventory Injector */
{
  "path": "/products/manto-brasil",
  "method": "update",
  "auth": { "uid": "cust-4", "token": { "email": "customer@email.com", "email_verified": true } },
  "data": { "stock": -100 }
}

/* Payload 7: Bypassing Immutable Fields (Order Timestamp) */
{
  "path": "/orders/PED-1234",
  "method": "update",
  "auth": { "uid": "cust-5", "token": { "email": "customer@email.com", "email_verified": true } },
  "data": { "date": "2020-01-01T00:00:00Z" }
}

/* Payload 8: Malicious ID Injection */
{
  "path": "/products/invalid_item_!@@#$",
  "method": "create",
  "auth": { "uid": "admin-1", "token": { "email": "admin@camisa7.com.br", "email_verified": true } },
  "data": { "id": "invalid_item_!@@#$", "name": "Damaged", "category": "esportivo", "price": 100.0, "stock": 5, "images": ["valid.png"] }
}

/* Payload 9: Email Spoofing Attack */
{
  "path": "/products/manto-brasil",
  "method": "update",
  "auth": { "uid": "spoof-1", "token": { "email": "admin@camisa7.com.br", "email_verified": false } },
  "data": { "price": 1.0 }
}

/* Payload 10: Shadow Key Exploit */
{
  "path": "/products/manto-brasil",
  "method": "update",
  "auth": { "uid": "cust-6", "token": { "email": "customer@email.com", "email_verified": true } },
  "data": { "isAdmin": true }
}

/* Payload 11: Order Modification After Termination */
{
  "path": "/orders/PED-9999",
  "method": "update",
  "auth": { "uid": "cust-7", "token": { "email": "customer@email.com", "email_verified": true } },
  "existing_data": { "status": "retirado", "customerEmail": "customer@email.com" },
  "data": { "status": "reservado" }
}

/* Payload 12: PII Leak on Customer Info */
{
  "path": "/orders/PED-9999",
  "method": "get",
  "auth": { "uid": "other-user", "token": { "email": "other@email.com", "email_verified": true } },
  "existing_data": { "customerEmail": "customer@email.com", "customerPhone": "(11) 99999-9999" }
}
```

## 5. Mock Test Runner (firestore.rules.test.ts)

A TypeScript representation for local testing and continuous integration rule validation:

```typescript
import { 
  initializeTestEnvironment, 
  RulesTestEnvironment 
} from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';

describe('Zero-Trust Firestore Security Rule Safeguards', () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'reflecting-honor-k07pf',
      firestore: {
        rules: require('fs').readFileSync('firestore.rules', 'utf8')
      }
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('rejects unauthenticated attempts to inject custom products (Payload 1)', async () => {
    const context = testEnv.unauthenticatedContext();
    const ref = doc(context.firestore(), 'products/fake-jersey');
    await expect(setDoc(ref, {
      id: 'fake-jersey',
      name: 'Fake Manto',
      category: 'esportivo',
      price: 0.0,
      stock: 99,
      images: ['fake.png']
    })).rejects.toThrow();
  });

  it('blocks price tampering by unauthorized clients (Payload 2)', async () => {
    const context = testEnv.authenticatedContext('cust-1', { email: 'customer@email.com', email_verified: true });
    const ref = doc(context.firestore(), 'products/manto-brasil');
    await expect(updateDoc(ref, { price: -10.0 })).rejects.toThrow();
  });

  it('blocks banner creation spoofing from standard users (Payload 3)', async () => {
    const context = testEnv.authenticatedContext('attacker-1', { email: 'attacker@email.com', email_verified: true });
    const ref = doc(context.firestore(), 'banners/fake-banner');
    await expect(setDoc(ref, {
      id: 'fake-banner',
      title: 'Phishing Banner',
      subtitle: 'Click Here',
      image: 'malicious.png',
      buttonText: 'Get Free'
    })).rejects.toThrow();
  });

  it('prevents clients from setting order status to retrieved (Payload 4)', async () => {
    const context = testEnv.authenticatedContext('cust-2', { email: 'customer@email.com', email_verified: true });
    const ref = doc(context.firestore(), 'orders/PED-1234');
    await expect(updateDoc(ref, { status: 'retirado' })).rejects.toThrow();
  });

  it('blocks anonymous and standard users from deleting promo banners (Payload 5)', async () => {
    const context = testEnv.authenticatedContext('cust-3', { email: 'customer@email.com', email_verified: true });
    const ref = doc(context.firestore(), 'banners/banner-brasil');
    await expect(deleteDoc(ref)).rejects.toThrow();
  });

  it('blocks unauthorized PII reading from random accounts (Payload 12)', async () => {
    const context = testEnv.authenticatedContext('other-user', { email: 'other@email.com', email_verified: true });
    const ref = doc(context.firestore(), 'orders/PED-9999');
    await expect(getDoc(ref)).rejects.toThrow();
  });
});
```
