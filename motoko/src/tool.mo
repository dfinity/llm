import Array "mo:base/Array";

module {
    /// Represents a tool that can be called by an agent.
    public type Tool = {
        #function : Function;
    };

    /// An argument to be provided to a tool.
    public type ToolCallArgument = {
        name : Text;
        value : Text;
    };

    public type FunctionCall = {
        name : Text;
        arguments : [ToolCallArgument];
    };

    public type ToolCall = {
        id : Text;
        function : FunctionCall;
    };

    /// Represents a function tool with name, description, and parameters.
    public type Function = {
        name : Text;
        description : ?Text;
        parameters : ?Parameters;
    };

    /// Defines the structure of parameters for a function tool.
    public type Parameters = {
        type_ : Text;
        properties : ?[Property];
        required : ?[Text];
    };

    /// Represents a single parameter property.
    public type Property = {
        type_ : Text;
        name : Text;
        description : ?Text;
        enum_ : ?[Text];
    };

    /// Enum representing the types a parameter can have.
    public type ParameterType = {
        #String;
        #Boolean;
        #Number;
        // Can be extended with more types as needed
    };

    /// Converts a ParameterType to its string representation.
    public func parameterTypeToText(type_ : ParameterType) : Text {
        switch (type_) {
            case (#String) "string";
            case (#Boolean) "boolean";
            case (#Number) "number";
        };
    };

    /// Builder for creating a parameter for a function tool.
    public class ParameterBuilder(name : Text, type_ : ParameterType) = self {
        private var _name : Text = name;
        private var _type : ParameterType = type_;
        private var _description : ?Text = null;
        private var _required : Bool = false;
        private var _enum_values : ?[Text] = null;

        /// Add a description to the parameter.
        public func withDescription(description : Text) : ParameterBuilder {
            _description := ?description;
            return self;
        };

        /// Mark the parameter as required.
        public func isRequired() : ParameterBuilder {
            _required := true;
            return self;
        };

        /// Add allowed enum values for the parameter.
        public func withEnumValues(values : [Text]) : ParameterBuilder {
            _enum_values := ?values;
            return self;
        };

        /// Get the parameter name.
        public func getName() : Text {
            _name;
        };

        /// Get the parameter type.
        public func getType() : ParameterType {
            _type;
        };

        /// Get the parameter description.
        public func getDescription() : ?Text {
            _description;
        };

        /// Check if the parameter is required.
        public func isRequiredValue() : Bool {
            _required;
        };

        /// Get the enum values if any.
        public func getEnumValues() : ?[Text] {
            _enum_values;
        };

        /// Convert the builder to a Property.
        public func toProperty() : Property {
            {
                type_ = parameterTypeToText(_type);
                name = _name;
                description = _description;
                enum_ = _enum_values;
            };
        };
    };

    /// Builder for creating a function tool.
    public class ToolBuilder(name : Text) = self {
        private var function : Function = {
            name = name;
            description = null;
            parameters = null;
        };

        private var parameters : [ParameterBuilder] = [];

        /// Adds a description to the function.
        public func withDescription(description : Text) : ToolBuilder {
            function := {
                name = function.name;
                description = ?description;
                parameters = function.parameters;
            };
            return self;
        };

        /// Adds a parameter to the function.
        public func withParameter(parameter : ParameterBuilder) : ToolBuilder {
            parameters := Array.append(parameters, [parameter]);
            return self;
        };

        /// Builds the final Tool.
        public func build() : Tool {
            if (parameters.size() > 0) {
                let properties = Array.map<ParameterBuilder, Property>(
                    parameters,
                    func(p) { p.toProperty() },
                );
                let required = Array.map<ParameterBuilder, Text>(
                    Array.filter<ParameterBuilder>(
                        parameters,
                        func(p) { p.isRequiredValue() },
                    ),
                    func(p) { p.getName() },
                );

                let updatedFunction = {
                    name = function.name;
                    description = function.description;
                    parameters = ?{
                        type_ = "object";
                        properties = ?properties;
                        required = if (required.size() > 0) ?required else null;
                    };
                };

                #function(updatedFunction);
            } else {
                #function(function);
            };
        };
    };

    /// Retrieves the argument of the given `FunctionCall`.
    public func getArgument(functionCall : FunctionCall, argumentName : Text) : ?Text {
        switch (
            Array.find<ToolCallArgument>(
                functionCall.arguments,
                func(arg) : Bool {
                    arg.name == argumentName;
                },
            )
        ) {
            case (null) { null };
            case (?arg) { ?arg.value };
        };
    };
};
