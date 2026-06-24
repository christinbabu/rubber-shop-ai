# MongoDB Schema Guidance

This folder contains MongoDB collection schema examples for the Rubber Trader Management & E-Commerce Platform.

## Recommended Collections

- `users`
- `products`
- `orders`
- `rubber_transactions`
- `payments`
- `inventory_events`
- `capital_management`
- `expenses`
- `advances`

## Notes

- Use embedded subdocuments for customer bank details and order items.
- Use indexes on fields such as `customerId`, `status`, and `createdAt`.
- Prefer embedding when one parent document owns the child data and the child data is not reused separately.
- Use references when the related data is large or shared across multiple parents.
