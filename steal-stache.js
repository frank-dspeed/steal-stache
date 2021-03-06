"format cjs";
var getIntermediateAndImports = require("can-stache/src/intermediate_and_imports");
var addBundles = require("./add-bundles");

function template(imports, intermediate, filename){
	imports = JSON.stringify(imports);
	intermediate = JSON.stringify(intermediate);

	return "define("+imports+",function(module, stache, mustacheCore){\n" +
		(filename ?
			"\tvar renderer = stache(" + JSON.stringify(filename) + ", " + intermediate + ");\n" :
			"\tvar renderer = stache(" + intermediate + ");\n"
		) +
		"\treturn function(scope, options, nodeList){\n" +
		"\t\tvar moduleOptions = { module: module };\n" +
		"\t\tif(!(options instanceof mustacheCore.Options)) {\n" +
		"\t\t\toptions = new mustacheCore.Options(options || {});\n" +
		"\t\t}\n" +
		"\t\treturn renderer(scope, options.add(moduleOptions), nodeList);\n" +
		"\t};\n" +
	"});";
}

//!steal-remove-start
function getFilename(name) {
	var hash = name.indexOf('#');
	var bang = name.indexOf('!');

	return name.slice(hash < bang ? (hash + 1) : 0, bang);
}
//!steal-remove-end

function translate(load) {

	var filename;
	//!steal-remove-start
	filename = getFilename(load.name);
	//!steal-remove-end

	var intermediateAndImports = getIntermediateAndImports(filename, load.source);

	var commonDependencies = Promise.all([
		this.normalize("can-view-import", module.id),
		this.normalize("can-stache-bindings", module.id)
	]);


	// Add bundle configuration for these dynamic imports
	return Promise.all([
		addBundles(intermediateAndImports.dynamicImports, load.name),
		commonDependencies
	]).then(function(results){
		var imports = results[1];

		// In add in the common dependencies of every stache file
		intermediateAndImports.imports.unshift.apply(
			intermediateAndImports.imports, imports
		);

		intermediateAndImports.imports.unshift("can-stache/src/mustache_core");
		intermediateAndImports.imports.unshift("can-stache");
		intermediateAndImports.imports.unshift("module");

		return template(intermediateAndImports.imports, intermediateAndImports.intermediate, filename);
	});
}

module.exports = {
	translate: translate
};
