# depend.js 

 Depend.js add behavior directly into html input element via attribue and logical statement into.

 Can be compoused large and complex graph of dependencyes.

 The only think is that graph have to be [Directed Acyclic Graph]( https://en.wikipedia.org/wiki/Directed_acyclic_graph )

 Depend.js focuses to the most commonly used element states of an input form.

 Show/Hide, Enabled/Disabled, Optional/Required.

 Simple logic into attribute 'depend' include include next elements which deinining the behavior of the element:

 1. Functions - "show->[]", "hide->[]", "enabled->[]", "disabled->[]", "optional->[]", "required→[]".

 2. Delimiter between the functions - ",".

 3. Logical Operators - "**(**", "**)**", "**&&**", "**||**", "**!**".

 4. *CSS Selectors*.

 Syntax example:

 enabled->[*input[name=checkbox1]* **&&** **!** *input[name=checkbox2]* **&&** *input[name=checkbox3]*], optional->[*input[name=checkbox2]*]
