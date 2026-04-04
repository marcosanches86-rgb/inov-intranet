<?php
declare(strict_types=1);

// ================================================================
//  Router — Simple Pattern-Matching Dispatcher
//
//  Supports:
//   - HTTP methods: GET, POST, PUT, PATCH, DELETE
//   - URL params:   /users/{id}  → $request->param('id')
//   - Middlewares:  per-route middleware chain
// ================================================================

class Router
{
    private array $routes = [];

    // ── Route registration ────────────────────────────────────────

    public function get(string $path, array $handler, array $middlewares = []): void
    {
        $this->add('GET', $path, $handler, $middlewares);
    }

    public function post(string $path, array $handler, array $middlewares = []): void
    {
        $this->add('POST', $path, $handler, $middlewares);
    }

    public function put(string $path, array $handler, array $middlewares = []): void
    {
        $this->add('PUT', $path, $handler, $middlewares);
    }

    public function patch(string $path, array $handler, array $middlewares = []): void
    {
        $this->add('PATCH', $path, $handler, $middlewares);
    }

    public function delete(string $path, array $handler, array $middlewares = []): void
    {
        $this->add('DELETE', $path, $handler, $middlewares);
    }

    private function add(string $method, string $path, array $handler, array $middlewares): void
    {
        $this->routes[] = [
            'method'      => strtoupper($method),
            'path'        => $path,
            'pattern'     => $this->toPattern($path),
            'handler'     => $handler,
            'middlewares' => $middlewares,
        ];
    }

    /**
     * Convert route path to regex pattern.
     * {param} → named capture group (?P<param>[^/]+)
     */
    private function toPattern(string $path): string
    {
        $pattern = preg_replace('/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/', '(?P<$1>[^/]+)', $path);
        return '#^' . $pattern . '$#';
    }

    // ── Dispatch ──────────────────────────────────────────────────

    public function dispatch(Request $request): void
    {
        $method = $request->getMethod();
        $path   = $request->getPath();

        // Strip base path prefix if API is in a subdirectory
        // e.g. if deployed at /backend, strip it: /backend/api/users → /api/users
        // Adjust BASE_PREFIX in app.php if needed
        $path = preg_replace('#^/backend#', '', $path) ?: '/';

        $pathMatchedOnDifferentMethod = false;

        foreach ($this->routes as $route) {
            // Check if path matches (regardless of method) — for 405 detection
            if (!preg_match($route['pattern'], $path)) {
                continue;
            }

            // Path matches — method must also match
            if ($route['method'] !== $method) {
                $pathMatchedOnDifferentMethod = true;
                continue;
            }

            // Extract named URL params (skip integer keys from preg_match)
            preg_match($route['pattern'], $path, $matches);
            $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);
            $request->setParams($params);

            // Execute middleware chain
            foreach ($route['middlewares'] as $middleware) {
                if (is_array($middleware) && count($middleware) === 2) {
                    // [ClassName, argument] — e.g. RoleMiddleware::role('admin')
                    [$class, $arg] = $middleware;
                    (new $class())->handle($request, $arg);
                } else {
                    // ClassName — instantiate and call handle
                    (new $middleware())->handle($request);
                }
            }

            // Execute controller method
            [$controllerClass, $action] = $route['handler'];
            $controller = new $controllerClass();

            if (!method_exists($controller, $action)) {
                Response::serverError("Método {$action} não encontrado em {$controllerClass}");
            }

            $controller->$action($request);
            return;
        }

        // Path matched but wrong HTTP method → 405
        if ($pathMatchedOnDifferentMethod) {
            Response::methodNotAllowed();
        }

        // No route matched at all → 404
        Response::notFound('Endpoint não encontrado: ' . $method . ' ' . $path);
    }
}
