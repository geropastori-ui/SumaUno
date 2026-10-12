/**
 * Contrato de la capa de pagos (Fase 2: reservas de turnos en clubes).
 * SIN IMPLEMENTAR en el MVP. La primera implementación prevista es Mercado Pago
 * en modo marketplace: el club conecta su cuenta (OAuth) y cobra directo; la
 * plataforma retiene una comisión por transacción. El diseño concreto se valida
 * contra la documentación oficial vigente antes de implementarlo.
 */

export type Money = { amount: number; currency: "ARS" };

export type SellerConnection = {
  provider: PaymentProviderId;
  externalAccountId: string;
  status: "pending" | "connected" | "revoked";
};

export type CheckoutRequest = {
  bookingId: string;
  clubId: string;
  description: string;
  total: Money;
  /** Comisión de la plataforma sobre esta reserva. */
  platformFee: Money;
  payerEmail?: string;
  returnUrl: string;
};

export type CheckoutSession = { provider: PaymentProviderId; externalId: string; redirectUrl: string };

export type PaymentEvent = {
  provider: PaymentProviderId;
  externalId: string;
  bookingId: string;
  status: "pending" | "approved" | "rejected" | "refunded" | "cancelled";
};

export type PaymentProviderId = "mercadopago";

export interface PaymentProvider {
  readonly id: PaymentProviderId;
  /** URL para que un club conecte su cuenta de cobro. */
  getSellerOnboardingUrl(clubId: string, returnUrl: string): Promise<string>;
  /** Completa la conexión con el código que devuelve el proveedor. */
  completeSellerOnboarding(clubId: string, code: string): Promise<SellerConnection>;
  /** Crea el checkout de una reserva, con split entre club y plataforma. */
  createCheckout(request: CheckoutRequest): Promise<CheckoutSession>;
  /** Valida y traduce una notificación (webhook) del proveedor. */
  parseWebhook(headers: Headers, body: string): Promise<PaymentEvent | null>;
  refund(externalId: string, amount?: Money): Promise<void>;
}
