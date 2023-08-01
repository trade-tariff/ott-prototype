Updates to additional codes and certificates (document codes) APIs

Due to performance issues on the additional code and certificate APIs, we have updated the content that is returned from these APIs, and the same is reflected on the UI of the Trade Tariff.

Instead of returning the tariff measures associated with the additional codes and the certificates, we are now just returning the discrete commodity codes that are associated with these objects.

The purpose of this is to reduce the size of the returned data set, and therefore make it possible to return data for the most highly populated entities, such as the <abbr title="VAT Zero Rate">VATZ</abbr> additional code.
