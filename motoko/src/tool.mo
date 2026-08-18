import Array "mo:core/Array";

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
    public module ParameterBuilder {
        public type ParameterBuilder = {
            name : Text;
            parameterType : ParameterType;
            var description : ?Text;
            var required : Bool;
            var enumValues : ?[Text];
        };

        public func new(name : Text, type_ : ParameterType) : ParameterBuilder {
            {
                name = name;
                parameterType = type_;
                var description = null;
                var required = false;
                var enumValues = null;
            };
        };

        /// Add a description to the parameter.
        public func withDescription(self : ParameterBuilder, description : Text) : ParameterBuilder {
            self.description := ?description;
            self;
        };

        /// Mark the parameter as required.
        public func isRequired(self : ParameterBuilder) : ParameterBuilder {
            self.required := true;
            self;
        };

        /// Add allowed enum values for the parameter.
        public func withEnumValues(self : ParameterBuilder, values : [Text]) : ParameterBuilder {
            self.enumValues := ?values;
            self;
        };

        /// Convert the builder to a Property.
        public func toProperty(self : ParameterBuilder) : Property {
            {
                type_ = parameterTypeToText(self.parameterType);
                name = self.name;
                description = self.description;
                enum_ = self.enumValues;
            };
        };
    };

    /// Builder for creating a function tool.
    public module ToolBuilder {
        public type ToolBuilder = {
            name : Text;
            var description : ?Text;
            var parameters : [ParameterBuilder.ParameterBuilder];
        };

        public func new(name : Text) : ToolBuilder {
            {
                name = name;
                var description = null;
                var parameters = [];
            };
        };

        /// Adds a description to the function.
        public func withDescription(self : ToolBuilder, description : Text) : ToolBuilder {
            self.description := ?description;
            self;
        };

        /// Adds a parameter to the function.
        public func withParameter(self : ToolBuilder, parameter : ParameterBuilder.ParameterBuilder) : ToolBuilder {
            self.parameters := self.parameters.concat([parameter]);
            self;
        };

        /// Builds the final Tool.
        public func build(self : ToolBuilder) : Tool {
            if (self.parameters.size() == 0) {
                return #function({
                    name = self.name;
                    description = self.description;
                    parameters = null;
                });
            };

            let properties = self.parameters.map<ParameterBuilder.ParameterBuilder, Property>(func(p) { p.toProperty() });
            let required = self.parameters
                .filter<ParameterBuilder.ParameterBuilder>(func(p) { p.required })
                .map<ParameterBuilder.ParameterBuilder, Text>(func(p) { p.name });

            #function({
                name = self.name;
                description = self.description;
                parameters = ?{
                    type_ = "object";
                    properties = ?properties;
                    required = if (required.size() > 0) ?required else null;
                };
            });
        };
    };

    /// Retrieves the argument of the given `FunctionCall`.
    public func getArgument(functionCall : FunctionCall, argumentName : Text) : ?Text {
        switch (
            functionCall.arguments.find<ToolCallArgument>(func(arg) { arg.name == argumentName })
        ) {
            case (null) { null };
            case (?arg) { ?arg.value };
        };
    };
};
