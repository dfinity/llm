use candid::CandidType;
use serde::{Deserialize, Serialize};

#[derive(CandidType, Clone, Serialize, Deserialize, Debug, PartialEq, Eq)]
pub enum Tool {
    #[serde(rename = "function")]
    Function(Function),
}

#[derive(CandidType, Clone, Serialize, Deserialize, Debug, PartialEq, Eq)]
pub struct Parameters {
    #[serde(rename = "type")]
    pub type_: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub properties: Option<Vec<Property>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub required: Option<Vec<String>>,
}

#[derive(CandidType, Clone, Serialize, Deserialize, Debug, PartialEq, Eq)]
pub struct Function {
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub parameters: Option<Parameters>,
}

#[derive(CandidType, Clone, Serialize, Deserialize, Debug, PartialEq, Eq)]
pub struct Property {
    #[serde(rename = "type")]
    pub type_: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(rename = "enum", skip_serializing_if = "Option::is_none")]
    pub enum_: Option<Vec<String>>,
}

/// Enum representing the types a parameter can have.
#[derive(Clone, Debug)]
pub enum ParameterType {
    String,
    Boolean,
    Number,
    // Can be extended with more types as needed
}

impl ParameterType {
    fn as_str(&self) -> &'static str {
        match self {
            ParameterType::String => "string",
            ParameterType::Boolean => "boolean",
            ParameterType::Number => "number",
        }
    }
}

/// Builder for creating a parameter for a function tool.
#[derive(Clone, Debug)]
pub struct ParameterBuilder {
    name: String,
    type_: ParameterType,
    description: Option<String>,
    required: bool,
    enum_values: Option<Vec<String>>,
}

impl ParameterBuilder {
    /// Create a new parameter builder with a name and type.
    pub fn new<S: Into<String>>(name: S, type_: ParameterType) -> Self {
        Self {
            name: name.into(),
            type_,
            description: None,
            required: false,
            enum_values: None,
        }
    }

    /// Add a description to the parameter.
    pub fn with_description<S: Into<String>>(mut self, description: S) -> Self {
        self.description = Some(description.into());
        self
    }

    /// Mark the parameter as required.
    pub fn is_required(mut self) -> Self {
        self.required = true;
        self
    }

    /// Add allowed enum values for the parameter.
    pub fn with_enum_values<S: Into<String>, I: IntoIterator<Item = S>>(
        mut self,
        values: I,
    ) -> Self {
        self.enum_values = Some(values.into_iter().map(|s| s.into()).collect());
        self
    }

    /// Convert the builder to a Property.
    fn to_property(&self) -> Property {
        Property {
            type_: self.type_.as_str().to_string(),
            name: self.name.clone(),
            description: self.description.clone(),
            enum_: self.enum_values.clone(),
        }
    }
}

/// Builder for creating a function tool.
pub struct ToolBuilder {
    function: Function,
    parameters: Vec<ParameterBuilder>,
}

impl ToolBuilder {
    /// Creates a new tool builder with a function name.
    pub fn new<S: Into<String>>(name: S) -> Self {
        Self {
            function: Function {
                name: name.into(),
                description: None,
                parameters: None,
            },
            parameters: Vec::new(),
        }
    }

    /// Adds a description to the function.
    pub fn with_description<S: Into<String>>(mut self, description: S) -> Self {
        self.function.description = Some(description.into());
        self
    }

    /// Adds a parameter to the function.
    pub fn with_parameter(mut self, parameter: ParameterBuilder) -> Self {
        self.parameters.push(parameter);
        self
    }

    /// Builds the final Tool.
    pub fn build(self) -> Tool {
        let mut function = self.function;

        if !self.parameters.is_empty() {
            let properties = self
                .parameters
                .iter()
                .map(|p| p.to_property())
                .collect::<Vec<_>>();
            let required = self
                .parameters
                .iter()
                .filter(|p| p.required)
                .map(|p| p.name.clone())
                .collect::<Vec<_>>();

            function.parameters = Some(Parameters {
                type_: "object".to_string(),
                properties: Some(properties),
                required: if required.is_empty() {
                    None
                } else {
                    Some(required)
                },
            });
        }

        Tool::Function(function)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn create_simple_tool() {
        let tool = ToolBuilder::new("test_tool").build();

        let expected = Tool::Function(Function {
            name: "test_tool".to_string(),
            description: None,
            parameters: None,
        });

        assert_eq!(tool, expected);
    }

    #[test]
    fn tool_with_description() {
        let tool = ToolBuilder::new("test_tool")
            .with_description("This is a test tool")
            .build();

        let expected = Tool::Function(Function {
            name: "test_tool".to_string(),
            description: Some("This is a test tool".to_string()),
            parameters: None,
        });

        assert_eq!(tool, expected);
    }

    #[test]
    fn tool_with_single_parameter() {
        let tool = ToolBuilder::new("test_tool")
            .with_parameter(
                ParameterBuilder::new("param1", ParameterType::String)
                    .with_description("Test parameter")
                    .is_required(),
            )
            .build();

        let expected = Tool::Function(Function {
            name: "test_tool".to_string(),
            description: None,
            parameters: Some(Parameters {
                type_: "object".to_string(),
                properties: Some(vec![Property {
                    name: "param1".to_string(),
                    type_: "string".to_string(),
                    description: Some("Test parameter".to_string()),
                    enum_: None,
                }]),
                required: Some(vec!["param1".to_string()]),
            }),
        });

        assert_eq!(tool, expected);
    }

    #[test]
    fn tool_with_multiple_parameters() {
        let tool = ToolBuilder::new("weather_tool")
            .with_description("Get weather information")
            .with_parameter(
                ParameterBuilder::new("location", ParameterType::String)
                    .with_description("City name")
                    .is_required(),
            )
            .with_parameter(
                ParameterBuilder::new("units", ParameterType::String)
                    .with_description("Temperature units"),
            )
            .with_parameter(
                ParameterBuilder::new("forecast", ParameterType::Boolean)
                    .with_description("Include forecast"),
            )
            .build();

        let expected = Tool::Function(Function {
            name: "weather_tool".to_string(),
            description: Some("Get weather information".to_string()),
            parameters: Some(Parameters {
                type_: "object".to_string(),
                properties: Some(vec![
                    Property {
                        name: "location".to_string(),
                        type_: "string".to_string(),
                        description: Some("City name".to_string()),
                        enum_: None,
                    },
                    Property {
                        name: "units".to_string(),
                        type_: "string".to_string(),
                        description: Some("Temperature units".to_string()),
                        enum_: None,
                    },
                    Property {
                        name: "forecast".to_string(),
                        type_: "boolean".to_string(),
                        description: Some("Include forecast".to_string()),
                        enum_: None,
                    },
                ]),
                required: Some(vec!["location".to_string()]),
            }),
        });

        assert_eq!(tool, expected);
    }

    #[test]
    fn optional_parameter() {
        let tool = ToolBuilder::new("test_tool")
            .with_parameter(
                ParameterBuilder::new("optional_param", ParameterType::String)
                    .with_description("This parameter is optional"), // Not calling is_required()
            )
            .build();

        let expected = Tool::Function(Function {
            name: "test_tool".to_string(),
            description: None,
            parameters: Some(Parameters {
                type_: "object".to_string(),
                properties: Some(vec![Property {
                    name: "optional_param".to_string(),
                    type_: "string".to_string(),
                    description: Some("This parameter is optional".to_string()),
                    enum_: None,
                }]),
                required: None,
            }),
        });

        assert_eq!(tool, expected);
    }

    #[test]
    fn parameter_type_conversion() {
        assert_eq!(ParameterType::String.as_str(), "string");
        assert_eq!(ParameterType::Boolean.as_str(), "boolean");
        assert_eq!(ParameterType::Number.as_str(), "number");
    }

    #[test]
    fn weather_tool_example() {
        // Test the example from the documentation
        let weather_tool = ToolBuilder::new("get_current_weather")
            .with_description("Get current weather for a location.")
            .with_parameter(
                ParameterBuilder::new("location", ParameterType::String)
                    .with_description("The location to get the weather for (e.g. Cairo, Egypt)")
                    .is_required(),
            )
            .build();

        let expected = Tool::Function(Function {
            name: "get_current_weather".to_string(),
            description: Some("Get current weather for a location.".to_string()),
            parameters: Some(Parameters {
                type_: "object".to_string(),
                properties: Some(vec![Property {
                    name: "location".to_string(),
                    type_: "string".to_string(),
                    description: Some(
                        "The location to get the weather for (e.g. Cairo, Egypt)".to_string(),
                    ),
                    enum_: None,
                }]),
                required: Some(vec!["location".to_string()]),
            }),
        });

        assert_eq!(weather_tool, expected);
    }

    #[test]
    fn number_parameter() {
        let tool = ToolBuilder::new("calculator")
            .with_description("Perform mathematical calculations")
            .with_parameter(
                ParameterBuilder::new("value", ParameterType::Number)
                    .with_description("The numeric value to use in calculation")
                    .is_required(),
            )
            .build();

        let expected = Tool::Function(Function {
            name: "calculator".to_string(),
            description: Some("Perform mathematical calculations".to_string()),
            parameters: Some(Parameters {
                type_: "object".to_string(),
                properties: Some(vec![Property {
                    name: "value".to_string(),
                    type_: "number".to_string(),
                    description: Some("The numeric value to use in calculation".to_string()),
                    enum_: None,
                }]),
                required: Some(vec!["value".to_string()]),
            }),
        });

        assert_eq!(tool, expected);
    }

    #[test]
    fn enum_parameter() {
        let tool = ToolBuilder::new("unit_converter")
            .with_description("Convert between different units")
            .with_parameter(
                ParameterBuilder::new("value", ParameterType::Number)
                    .with_description("The value to convert")
                    .is_required(),
            )
            .with_parameter(
                ParameterBuilder::new("unit", ParameterType::String)
                    .with_description("The unit to convert to")
                    .with_enum_values(["meters", "feet", "kilometers", "miles"])
                    .is_required(),
            )
            .build();

        let expected = Tool::Function(Function {
            name: "unit_converter".to_string(),
            description: Some("Convert between different units".to_string()),
            parameters: Some(Parameters {
                type_: "object".to_string(),
                properties: Some(vec![
                    Property {
                        name: "value".to_string(),
                        type_: "number".to_string(),
                        description: Some("The value to convert".to_string()),
                        enum_: None,
                    },
                    Property {
                        name: "unit".to_string(),
                        type_: "string".to_string(),
                        description: Some("The unit to convert to".to_string()),
                        enum_: Some(vec![
                            "meters".to_string(),
                            "feet".to_string(),
                            "kilometers".to_string(),
                            "miles".to_string(),
                        ]),
                    },
                ]),
                required: Some(vec!["value".to_string(), "unit".to_string()]),
            }),
        });

        assert_eq!(tool, expected);
    }
}
