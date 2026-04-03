<?php
declare(strict_types=1);

// ================================================================
//  Validator — Input Validation Engine
//
//  Usage:
//    $v = new Validator();
//    $ok = $v->validate($data, [
//        'email'    => 'required|email|max:255',
//        'password' => 'required|min:8',
//        'role'     => 'required|in:admin,editor,colaborador',
//        'age'      => 'integer|min_val:18|max_val:100',
//    ]);
//    if (!$ok) Response::validationError($v->getErrors());
//
//  Available rules (pipe-separated):
//    required           — field must be present and non-empty
//    string             — must be a string
//    integer            — must be a whole number
//    numeric            — must be numeric
//    boolean            — must be truthy/falsy
//    email              — valid email format
//    url                — valid URL
//    min:N              — string length >= N
//    max:N              — string length <= N
//    min_val:N          — numeric value >= N
//    max_val:N          — numeric value <= N
//    in:a,b,c           — value must be one of listed
//    not_in:a,b         — value must NOT be one of listed
//    confirmed          — field must equal field_confirmation
//    regex:pattern      — must match regex (without delimiters)
//    date               — valid date (Y-m-d)
//    nullable           — allows null/empty (disables required check)
// ================================================================

class Validator
{
    private array $errors = [];

    /**
     * Validate $data against $rules.
     * Returns true if all rules pass, false otherwise.
     */
    public function validate(array $data, array $rules): bool
    {
        $this->errors = [];

        foreach ($rules as $field => $ruleString) {
            $ruleList  = explode('|', $ruleString);
            $value     = $data[$field] ?? null;
            $isNullable = in_array('nullable', $ruleList, true);
            $isEmpty   = ($value === null || $value === '');

            foreach ($ruleList as $rule) {
                [$name, $param] = $this->parseRule($rule);

                // ── required ─────────────────────────────────────
                if ($name === 'required') {
                    if ($isEmpty) {
                        $this->addError($field, 'O campo é obrigatório.');
                        break 2; // Skip remaining rules for this field
                    }
                    continue;
                }

                // ── nullable: skip remaining if empty ────────────
                if ($name === 'nullable') {
                    if ($isEmpty) break;
                    continue;
                }

                // Skip non-required empty fields (optional)
                if ($isEmpty && !in_array('required', $ruleList, true)) {
                    break;
                }

                // ── All other rules ───────────────────────────────
                $error = $this->applyRule($name, $param, $value, $data, $field);
                if ($error !== null) {
                    $this->addError($field, $error);
                    break; // One error per field is enough
                }
            }
        }

        return empty($this->errors);
    }

    private function applyRule(string $name, ?string $param, mixed $value, array $data, string $field): ?string
    {
        return match ($name) {

            'string'  => is_string($value)
                ? null
                : 'Deve ser texto.',

            'integer' => filter_var($value, FILTER_VALIDATE_INT) !== false
                ? null
                : 'Deve ser um número inteiro.',

            'numeric' => is_numeric($value)
                ? null
                : 'Deve ser um valor numérico.',

            'boolean' => in_array($value, [true, false, 0, 1, '0', '1', 'true', 'false'], true)
                ? null
                : 'Deve ser verdadeiro ou falso.',

            'email'   => filter_var($value, FILTER_VALIDATE_EMAIL) !== false
                ? null
                : 'Email inválido.',

            'url'     => filter_var($value, FILTER_VALIDATE_URL) !== false
                ? null
                : 'URL inválido.',

            'min'     => mb_strlen((string) $value) >= (int) $param
                ? null
                : "Deve ter pelo menos {$param} caracteres.",

            'max'     => mb_strlen((string) $value) <= (int) $param
                ? null
                : "Deve ter no máximo {$param} caracteres.",

            'min_val' => is_numeric($value) && (float) $value >= (float) $param
                ? null
                : "Valor mínimo: {$param}.",

            'max_val' => is_numeric($value) && (float) $value <= (float) $param
                ? null
                : "Valor máximo: {$param}.",

            'in'      => in_array((string) $value, explode(',', $param ?? ''), true)
                ? null
                : "Valor inválido. Aceite: {$param}.",

            'not_in'  => !in_array((string) $value, explode(',', $param ?? ''), true)
                ? null
                : "Este valor não é permitido.",

            'confirmed' => isset($data[$field . '_confirmation']) && $value === $data[$field . '_confirmation']
                ? null
                : 'Os valores não coincidem.',

            'regex'   => (bool) preg_match('/' . $param . '/', (string) $value)
                ? null
                : 'Formato inválido.',

            'date'    => (bool) strtotime((string) $value) && (bool) \DateTime::createFromFormat('Y-m-d', (string) $value)
                ? null
                : 'Data inválida (formato esperado: YYYY-MM-DD).',

            'alpha_num' => ctype_alnum((string) $value)
                ? null
                : 'Deve conter apenas letras e números.',

            'slug'    => (bool) preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', (string) $value)
                ? null
                : 'Slug inválido (use apenas letras minúsculas, números e hífens).',

            default   => null, // Unknown rule — ignore silently
        };
    }

    private function parseRule(string $rule): array
    {
        $parts = explode(':', $rule, 2);
        return [$parts[0], $parts[1] ?? null];
    }

    private function addError(string $field, string $message): void
    {
        // Keep only the first error per field
        if (!isset($this->errors[$field])) {
            $this->errors[$field] = $message;
        }
    }

    public function getErrors(): array
    {
        return $this->errors;
    }

    public function fails(): bool
    {
        return !empty($this->errors);
    }

    public function passes(): bool
    {
        return empty($this->errors);
    }

    /**
     * Static factory — run validation and return instance.
     */
    public static function make(array $data, array $rules): static
    {
        $v = new static();
        $v->validate($data, $rules);
        return $v;
    }

    /**
     * Validate and auto-respond with 422 if fails.
     * Returns validated data on success.
     */
    public static function validateOrFail(array $data, array $rules): array
    {
        $v = self::make($data, $rules);
        if ($v->fails()) {
            Response::validationError($v->getErrors());
        }
        return $data;
    }
}
