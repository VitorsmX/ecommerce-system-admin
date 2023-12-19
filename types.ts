interface Item {
    id: string;
    currency_id: string;
    title: string;
    picture_url: string;
    description: string;
    quantity: number;
    unit_price: number;
  }
  
  interface Phone {
    number: string;
  }
  
  interface Address {
    zip_code: number;
    street_name: string;
    street_number: number;
  }
  
  interface Identification {
    number: number;
    type: string;
  }
  
  interface Payer {
    phone: Phone;
    address: Address;
    identification: Identification;
  }
  
  interface PaymentMethods {
    excluded_payment_methods: Array<{}>;
    excluded_payment_types: Array<{}>;
  }
  
  interface Shipments {
    receiver_address: {};
  }
  
  interface PreferenceResponse {
    back_urls: {};
    client_id: number;
    collector_id: number;
    date_created: string;
    id: string;
    init_point: string;
    items: Item[];
    marketplace: string;
    marketplace_fee: number;
    statement_descriptor: string;
    payer: Payer;
    payment_methods: PaymentMethods;
    sandbox_init_point: string;
    shipments: Shipments;
  }
  