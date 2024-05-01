# Custom Filter Component

The Custom Filter Component helps you filter a datatable or datalist based on specific properties. You can apply up to 6 levels of filtering.

## Property Whitelist

The whitelist is a feature that lets you choose which properties should be shown on the left-hand side (LHS) of the filter. This includes both direct properties and properties from related data.

How to use the whitelist

1. Go to the Property Whitelist section in the component options.
2. Enter the properties you want to see in the LHS field and separate them with a comma (,).

The properties you enter should have the same format as the dataAPI (camelCase). If you are not sure about the format or name of the property, you can check the `DATABASE NAME` column in the model viewer. Replace each character after the underscore (_) with a capital letter and remove the underscore. So, for example: if the property is `my_property_name`, it becomes `myPropertyName`.

### Relational whitelisting

If you want to include properties from related data, follow this format:
Let's say we have a model called `shoppingCart` and`shoppingCart` **has many** `shopItems`. To include the properties of `shopItems` in the whitelist, use the following format:
`shopItems.name`

## Property Blacklist

The blacklist is the opposite of the whitelist. It allows you to specify which properties should not be shown on the LHS of the filter.