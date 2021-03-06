package com.cedarsoftware.util

import org.apache.tomcat.jdbc.pool.ConnectionPool
import org.apache.tomcat.jdbc.pool.JdbcInterceptor
import org.apache.tomcat.jdbc.pool.PooledConnection

import java.util.concurrent.atomic.AtomicInteger

/**
 * Tomcat JDBC connection pool monitor
 *
 * @author John DeRegnaucourt
 *         <br/>
 *         Copyright (c) Cedar Software LLC
 *         <br/><br/>
 *         Licensed under the Apache License, Version 2.0 (the "License");
 *         you may not use this file except in compliance with the License.
 *         You may obtain a copy of the License at
 *         <br/><br/>
 *         http://www.apache.org/licenses/LICENSE-2.0
 *         <br/><br/>
 *         Unless required by applicable law or agreed to in writing, software
 *         distributed under the License is distributed on an "AS IS" BASIS,
 *         WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *         See the License for the specific language governing permissions and
 *         limitations under the License.
 */
class PoolInterceptor extends JdbcInterceptor
{
    public static AtomicInteger size = new AtomicInteger()
    public static AtomicInteger active = new AtomicInteger()
    public static AtomicInteger idle = new AtomicInteger()

    void reset(ConnectionPool connectionPool, PooledConnection pooledConnection)
    {
        size.set(connectionPool.getSize())
        active.set(connectionPool.getActive())
        idle.set(connectionPool.getIdle())
    }
}
