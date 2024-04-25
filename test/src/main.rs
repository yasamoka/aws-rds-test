use std::{env, io::Cursor, str::FromStr};

use dotenvy::dotenv;
use rustls::ClientConfig;
use tokio_postgres::Config;
use tokio_postgres_rustls::MakeRustlsConnect;

#[tokio::main]
async fn main() {
    dotenv().unwrap();
    let database_url = env::var("DATABASE_URL").unwrap();
    let config = Config::from_str(database_url.as_str()).unwrap();

    // thanks to https://github.com/ecliptical/tokio-postgres-rustls-rds-demo/blob/master/src/main.rs
    let tls = {
        let bundle = include_bytes!("../global-bundle.pem");
        let mut cursor = Cursor::new(bundle);
        let certs = rustls_pemfile::certs(&mut cursor)
            .collect::<Result<Vec<_>, _>>()
            .unwrap();

        let mut root_store = rustls::RootCertStore::empty();
        for der in certs {
            root_store.add(der).unwrap();
        }

        let config = ClientConfig::builder()
            .with_root_certificates(root_store)
            .with_no_client_auth();
        MakeRustlsConnect::new(config)
    };
    let (client, connection) = config.connect(tls).await.unwrap();

    tokio::spawn(async move {
        if let Err(e) = connection.await {
            eprintln!("connection error: {e}")
        }
    });

    let rows = client.query("SELECT 1", &[]).await.unwrap();
    assert_eq!(rows.len(), 1);
    println!("Connected to database successfully.");
}
