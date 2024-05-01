# Custom Filter Component

The Custom Filter Component allows users to filter a datatable or datalist based on desired properties. It supports up to 6 levels of relational filtering.

## Property Whitelist

The whitelist is a feature of the Filter Component that allows you to specify which properties should be displayed on the left-hand side (LHS) of the filter. This includes both direct properties and properties from related data.

How to use the whitelist:

1. Go to the Property Whitelist section in the component options.
2. Define the properties you want to show in the LHS field and separate them with a comma (,).
π
The properties you define should have the same format as the dataAPI (camelCase). If you are uncertain what this format is, you can head over to your model in de model viewer and take a look at the `DATABASE NAME` column. Replace each character after the underscore (_), with a capital letter and then remove the underscore. So, for instance: `my_property_name` becomes `myPropertyName`.

### Relational whitelisting

If you want to whitelist properties from relational data, you can do by adhering to the following format:
Let's say we have a model `shoppingCart` and`shoppingCart` **has many** `shopItems`. To whitelist the properties of the `shopItems`, we can define the whitelist as follows:
`shopItems.name`

## Property Blacklist

The blacklist is the exact opposite feature of the whitelist. This feature allows you to specify which properties should **not** be displayed on the LHS of the filter. 
